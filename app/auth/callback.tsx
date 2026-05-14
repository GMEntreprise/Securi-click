import { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase/client';
import { mapSupabaseSessionToAuthSession } from '@/features/auth/utils/mapAuthSession';
import { useAuthStore } from '@/features/auth/store/auth.store';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const loginAction = useAuthStore(s => s.login);
  const handled = useRef(false);

  useEffect(() => {
    async function processUrl(url: string) {
      if (handled.current) return;

      // PKCE flow: Supabase sends securiclick://auth/callback?code=XXXX&type=magiclink
      // Legacy implicit flow would send #access_token=... fragment
      const queryString = url.includes('?') ? url.split('?')[1].split('#')[0] : '';
      const fragment = url.includes('#') ? url.split('#')[1] : '';

      const queryParams = new URLSearchParams(queryString);
      const fragmentParams = new URLSearchParams(fragment);

      const code = queryParams.get('code');
      const type = queryParams.get('type') ?? fragmentParams.get('type');

      // Legacy implicit tokens (fallback)
      const accessToken = fragmentParams.get('access_token') ?? queryParams.get('access_token');
      const refreshToken = fragmentParams.get('refresh_token') ?? queryParams.get('refresh_token');

      if (!code && !accessToken) return;
      handled.current = true;

      let sessionData: Awaited<ReturnType<typeof supabase.auth.exchangeCodeForSession>> |
        Awaited<ReturnType<typeof supabase.auth.setSession>>;

      if (code) {
        sessionData = await supabase.auth.exchangeCodeForSession(code);
      } else {
        sessionData = await supabase.auth.setSession({
          access_token: accessToken!,
          refresh_token: refreshToken!,
        });
      }

      const { data, error } = sessionData;

      if (error || !data.session) {
        router.replace('/(auth)/login' as any);
        return;
      }

      const authUser = data.session.user;

      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id, role')
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (!existingProfile) {
        const metaRole =
          (authUser.user_metadata?.role as string | undefined) ?? 'collector';
        await supabase.from('user_profiles').insert({
          user_id: authUser.id,
          first_name: (authUser.user_metadata?.first_name as string) ?? '',
          last_name: (authUser.user_metadata?.last_name as string) ?? '',
          role: metaRole,
        });
      }

      const session = await mapSupabaseSessionToAuthSession(data.session);
      loginAction(session);
      const role = session.user.role;

      if (type === 'recovery') {
        router.replace('/(auth)/login' as any);
      } else if (role === 'collector') {
        router.replace('/(collector-tabs)' as any);
      } else if (role === 'school_admin' || role === 'staff') {
        router.replace('/(school-tabs)/home' as any);
      } else {
        router.replace('/(parent-tabs)' as any);
      }
    }

    // Cold start: app opened by deep link
    Linking.getInitialURL().then(url => {
      if (url) processUrl(url);
    });

    // Warm start: app already running, deep link fired
    const sub = Linking.addEventListener('url', ({ url }) => processUrl(url));

    return () => sub.remove();
  }, [loginAction, router]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
