import { useEffect } from 'react';
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

  // Deep link tokens are handled in app/auth/callback.tsx which is the
  // registered redirect target for Supabase magic links / OTP.

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
    const inCallback = seg === 'auth'; // app/auth/callback.tsx handles token
    const role = useAuthStore.getState().session?.user.role;

    if (!isAuthenticated && !inAuth && !inCallback) {
      router.replace('/(auth)/login' as any);
    } else if (isAuthenticated && inAuth) {
      if (role === 'collector') {
        router.replace('/(collector-tabs)' as any);
      } else if (role === 'school_admin' || role === 'staff') {
        router.replace('/(school-tabs)/home' as any);
      } else {
        router.replace('/(parent-tabs)' as any);
      }
    } else if (isAuthenticated && !inAuth) {
      const inCollectorTabs = seg === '(collector-tabs)';
      const inSchoolTabs = seg === '(school-tabs)';
      const isSchool = role === 'school_admin' || role === 'staff';
      if (role === 'collector' && !inCollectorTabs) {
        router.replace('/(collector-tabs)' as any);
      } else if (isSchool && !inSchoolTabs) {
        router.replace('/(school-tabs)/home' as any);
      } else if (!isSchool && role !== 'collector' && inSchoolTabs) {
        router.replace('/(parent-tabs)' as any);
      } else if (role !== 'collector' && !isSchool && inCollectorTabs) {
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
