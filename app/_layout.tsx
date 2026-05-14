import { useEffect } from 'react';
import { Linking } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useRouter, useSegments, Slot } from 'expo-router';
import {
  useAuthStore,
  useIsAuthenticated,
  useIsRestoring,
} from '@/features/auth/store/auth.store';
import { supabase } from '@/lib/supabase/client';
import { mapSupabaseSessionToAuthSession } from '@/features/auth/utils/mapAuthSession';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/shared/ui/organisms/theme-switch/context';
import { ThemeMode } from '@/shared/ui/organisms/theme-switch/types';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 5 * 60 * 1000 },
  },
});

function NavigationGuard() {
  const router = useRouter();
  const segments = useSegments();
  const isAuthenticated = useIsAuthenticated();
  const isRestoring = useIsRestoring();
  const loginAction = useAuthStore(s => s.login);

  // Deep link handler
  useEffect(() => {
    async function handleUrl(url: string) {
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
      if (type === 'recovery') {
        router.replace('/(auth)/login' as any);
      } else {
        router.replace('/(parent-tabs)' as any);
      }
    }
    Linking.getInitialURL().then(url => {
      if (url) handleUrl(url);
    });
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, [loginAction, router]);

  // Sync Supabase auth state changes (token refresh, server-side signout)
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, sess) => {
      if (event === 'INITIAL_SESSION') return;
      if (!sess || event === 'SIGNED_OUT') {
        useAuthStore.setState({ session: null });
        return;
      }
      if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
        const session = await mapSupabaseSessionToAuthSession(sess);
        loginAction(session);
      }
    });
    return () => subscription.unsubscribe();
  }, [loginAction]);

  // Auth guard — role-based routing
  useEffect(() => {
    if (isRestoring) return;
    const seg = segments[0] as string;
    const inAuth = seg === '(auth)';
    const role = useAuthStore.getState().session?.user.role;

    if (!isAuthenticated && !inAuth) {
      router.replace('/(auth)/login' as any);
    } else if (isAuthenticated && inAuth) {
      if (role === 'collector') {
        router.replace('/(collector-tabs)' as any);
      } else {
        router.replace('/(parent-tabs)' as any);
      }
    } else if (isAuthenticated && !inAuth) {
      // Already in app — enforce correct tab group per role
      const inParentTabs = seg === '(parent-tabs)';
      const inCollectorTabs = seg === '(collector-tabs)';
      if (role === 'collector' && inParentTabs) {
        router.replace('/(collector-tabs)' as any);
      } else if (role !== 'collector' && inCollectorTabs) {
        router.replace('/(parent-tabs)' as any);
      }
    }
  }, [isAuthenticated, isRestoring, segments, router]);

  return null;
}

export default function RootLayout() {
  const initialize = useAuthStore(s => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme={ThemeMode.Light}>
          <NavigationGuard />
          <Slot />
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
