import { useCallback, useEffect, useRef } from 'react';
import { Modal } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useRouter, useSegments, Slot } from 'expo-router';
import * as Linking from 'expo-linking';
import {
  useAuthStore,
  useIsAuthenticated,
  useIsRestoring,
  useSession,
} from '@/features/auth/store/auth.store';
import { supabase } from '@/lib/supabase/client';
import { mapSupabaseSessionToAuthSession } from '@/features/auth/utils/mapAuthSession';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/shared/ui/organisms/theme-switch/context';
import { ThemeMode } from '@/shared/ui/organisms/theme-switch/types';
import { ToastProviderWithViewport, Toast } from '@/shared/ui/molecules/Toast';
import {
  registerPushToken,
  unregisterPushToken,
  addForegroundNotificationListener,
  addNotificationResponseListener,
  setBadgeCount,
} from '@/features/notifications/services/push.service';
import { useNotificationStore, useNotificationCenterOpen } from '@/features/notifications/stores/notification.store';
import { useUnreadCountQuery } from '@/features/notifications/hooks/useNotifications';
import { NotificationCenterScreen } from '@/features/notifications/screens/NotificationCenterScreen';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 5 * 60 * 1000 },
  },
});

function parseUrlCode(url: string): { code: string | null; type: string | null } {
  const qs = url.split('?')[1]?.split('#')[0] ?? '';
  const frag = url.split('#')[1] ?? '';
  const p = new URLSearchParams(qs || frag);
  return { code: p.get('code'), type: p.get('type') };
}

// Module-level flag: DeepLinkHandler sets this to true while processing a magic
// link so AuthStateSync ignores the concurrent SIGNED_IN event (which would
// re-fetch the profile before the INSERT is committed and resolve role: 'parent')
let deepLinkProcessing = false;

// Handles Supabase PKCE magic link deep links
function DeepLinkHandler() {
  const loginAction = useAuthStore(s => s.login);
  const router = useRouter();
  const codeHandled = useRef<string | null>(null);
  // useLinkingURL captures the URL that cold-started the app
  const coldStartUrl = Linking.useLinkingURL();

  const processUrl = useCallback(
    async (url: string | null) => {
      if (!url || !url.includes('auth/callback')) return;

      const { code, type } = parseUrlCode(url);
      if (!code) return;
      if (codeHandled.current === code) return;
      codeHandled.current = code;
      deepLinkProcessing = true;

      try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error || !data.session) {
          Toast.show('Lien expiré ou déjà utilisé. Demandez un nouveau lien.', {
            type: 'error',
            duration: 5000,
          });
          router.replace('/(auth)/collector' as any);
          return;
        }

        const authUser = data.session.user;

        const { data: existingProfile } = await supabase
          .from('user_profiles')
          .select('id, first_name, last_name, phone, school_id, role')
          .eq('user_id', authUser.id)
          .maybeSingle();

        let knownProfile = existingProfile
          ? {
              id: String(existingProfile.id),
              first_name: String(existingProfile.first_name ?? ''),
              last_name: String(existingProfile.last_name ?? ''),
              phone: existingProfile.phone ? String(existingProfile.phone) : undefined,
              school_id: existingProfile.school_id ? String(existingProfile.school_id) : undefined,
              role: existingProfile.role as any,
            }
          : null;

        if (!knownProfile) {
          const meta = authUser.user_metadata ?? {};
          const metaRole = (meta.role as string) ?? 'collector';

          // For school_admin: create the school record first, then link profile to it
          let schoolId: string | undefined;
          if (metaRole === 'school_admin') {
            const { data: school } = await supabase
              .from('schools')
              .insert({
                name: (meta.school_name as string) ?? '',
                type: (meta.school_type as string) ?? '',
                email: authUser.email ?? '',
                phone: (meta.phone as string) ?? '',
                address: (meta.address as string) ?? '',
                city: (meta.city as string) ?? '',
                postal_code: (meta.postal_code as string) ?? '',
                manager_first_name: (meta.manager_first_name as string) ?? '',
                manager_last_name: (meta.manager_last_name as string) ?? '',
                manager_function: (meta.manager_function as string) ?? '',
                admin_user_id: authUser.id,
              })
              .select('id')
              .single();
            schoolId = school?.id ? String(school.id) : undefined;
          }

          const { data: inserted } = await supabase
            .from('user_profiles')
            .insert({
              user_id: authUser.id,
              first_name: (meta.manager_first_name as string) || (meta.first_name as string) || '',
              last_name: (meta.manager_last_name as string) || (meta.last_name as string) || '',
              phone: (meta.phone as string) || null,
              role: metaRole,
              ...(schoolId ? { school_id: schoolId } : {}),
            })
            .select('id, first_name, last_name, phone, school_id, role')
            .single();

          if (inserted) {
            knownProfile = {
              id: String(inserted.id),
              first_name: String(inserted.first_name ?? ''),
              last_name: String(inserted.last_name ?? ''),
              phone: inserted.phone ? String(inserted.phone) : undefined,
              school_id: inserted.school_id ? String(inserted.school_id) : undefined,
              role: inserted.role as any,
            };
          }
        }

        const session = await mapSupabaseSessionToAuthSession(data.session, knownProfile);
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
      } finally {
        deepLinkProcessing = false;
      }
    },
    [loginAction, router]
  );

  // Cold-start: hook fires with the launch URL
  useEffect(() => {
    processUrl(coldStartUrl);
  }, [coldStartUrl, processUrl]);

  // Warm-start: app already running when link tapped — addEventListener catches it
  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      processUrl(url);
    });
    return () => subscription.remove();
  }, [processUrl]);

  return null;
}

// Syncs Supabase token refresh / signout events into the store
function AuthStateSync() {
  const loginAction = useAuthStore(s => s.login);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, sess) => {
      if (event === 'INITIAL_SESSION') return;
      // Skip SIGNED_IN fired by DeepLinkHandler's exchangeCodeForSession — it
      // handles role resolution itself with the freshly-inserted profile
      if (event === 'SIGNED_IN' && deepLinkProcessing) return;
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

  return null;
}

// Role-based route guard — redirects once per auth/segment transition
function NavigationGuard() {
  const router = useRouter();
  const segments = useSegments();
  const isAuthenticated = useIsAuthenticated();
  const isRestoring = useIsRestoring();
  const lastRedirect = useRef<string | null>(null);

  useEffect(() => {
    if (isRestoring) return;

    const seg = segments[0] as string;
    const inAuth = seg === '(auth)';
    const inCallback = seg === 'auth';
    const role = useAuthStore.getState().session?.user.role;

    let target: string | null = null;

    if (!isAuthenticated && !inAuth && !inCallback) {
      target = '/(auth)/login';
    } else if (isAuthenticated && inAuth) {
      if (role === 'collector') target = '/(collector-tabs)';
      else if (role === 'school_admin' || role === 'staff') target = '/(school-tabs)/home';
      else target = '/(parent-tabs)';
    } else if (isAuthenticated && !inAuth) {
      const inCollectorTabs = seg === '(collector-tabs)';
      const inSchoolTabs = seg === '(school-tabs)';
      const isSchool = role === 'school_admin' || role === 'staff';
      if (role === 'collector' && !inCollectorTabs) target = '/(collector-tabs)';
      else if (isSchool && !inSchoolTabs) target = '/(school-tabs)/home';
      else if (!isSchool && role !== 'collector' && inSchoolTabs) target = '/(parent-tabs)';
      else if (role !== 'collector' && !isSchool && inCollectorTabs) target = '/(parent-tabs)';
    }

    if (target && lastRedirect.current !== target) {
      lastRedirect.current = target;
      router.replace(target as any);
    }
  }, [isAuthenticated, isRestoring, segments, router]);

  return null;
}

// Registers push token + wires foreground/response listeners after login
function NotificationBootstrap() {
  const session = useSession();
  const userId = session?.user.id;
  const router = useRouter();
  const { setUnreadCount } = useNotificationStore.getState();
  useUnreadCountQuery();

  useEffect(() => {
    if (!userId) return;

    let tokenRegistered = false;

    registerPushToken().then(() => {
      tokenRegistered = true;
    });

    const foregroundSub = addForegroundNotificationListener(() => {
      // Badge is updated via realtime store; toast already shown by system
    });

    const responseSub = addNotificationResponseListener(response => {
      const data = response.notification.request.content.data as Record<string, unknown>;
      const route = (data?.route as string) ?? null;
      if (route) router.push(route as any);
    });

    return () => {
      foregroundSub.remove();
      responseSub.remove();
      if (tokenRegistered) unregisterPushToken();
    };
  }, [userId, router]);

  // Sync badge count with OS
  const unread = useNotificationStore(s => s.unreadCount);
  useEffect(() => {
    setBadgeCount(unread);
  }, [unread]);

  return null;
}

// Full-screen modal notification center — opened via NotificationBell
function NotificationCenterModal() {
  const isOpen = useNotificationCenterOpen();
  const closeCenter = useNotificationStore(s => s.closeCenter);

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={closeCenter}
    >
      <NotificationCenterScreen />
    </Modal>
  );
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
          <ToastProviderWithViewport>
            <DeepLinkHandler />
            <AuthStateSync />
            <NavigationGuard />
            <NotificationBootstrap />
            <NotificationCenterModal />
            <Slot />
          </ToastProviderWithViewport>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
