import { useEffect } from 'react';
import { Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { supabase } from '@/lib/supabase/client';
import { mapSupabaseSessionToAuthSession } from '@/features/auth/utils/mapAuthSession';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Slot } from 'expo-router';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function DeepLinkHandler() {
  const router = useRouter();
  const loginAction = useAuthStore(s => s.login);

  useEffect(() => {
    async function handleUrl(url: string) {
      // Supabase sends tokens in the fragment: securiclick://auth/callback#access_token=...&refresh_token=...
      const fragment = url.split('#')[1];
      if (!fragment) return;

      const params = new URLSearchParams(fragment);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const type = params.get('type');

      if (!accessToken || !refreshToken) return;

      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error || !data.session) return;

      const session = await mapSupabaseSessionToAuthSession(data.session);
      loginAction(session);

      if (type === 'signup' || type === 'email_change') {
        router.replace('/(parent-tabs)' as any);
      } else if (type === 'recovery') {
        router.replace('/(auth)/login' as any);
      } else {
        router.replace('/(parent-tabs)' as any);
      }
    }

    // App opened from a cold start via deep link
    Linking.getInitialURL().then(url => {
      if (url) handleUrl(url);
    });

    // App already open, link arrives
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, [loginAction, router]);

  return null;
}

export default function RootLayout() {
  const initializeAuth = useAuthStore(s => s.initialize);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <DeepLinkHandler />
      <Slot />
    </QueryClientProvider>
  );
}
