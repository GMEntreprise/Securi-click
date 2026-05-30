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
import { useCollectorSessionStore } from '@/features/collector/stores/collectorSession.store';
import { supabase } from '@/lib/supabase/client';
import { mapSupabaseSessionToAuthSession } from '@/features/auth/utils/mapAuthSession';
import { passwordLoginInProgress } from '@/features/auth/hooks/useLogin';
import { collectorPinLoginInProgress } from '@/features/collector/hooks/useCollectorPinLogin';
import { explicitLogoutInProgress } from '@/navigation/authFlags';
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
import {
  useNotificationStore,
  useNotificationCenterOpen,
} from '@/features/notifications/stores/notification.store';
import { useUnreadCountQuery } from '@/features/notifications/hooks/useNotifications';
import { NotificationCenterScreen } from '@/features/notifications/screens/NotificationCenterScreen';
import { NetworkBanner } from '@/shared/ui/molecules/NetworkBanner';
import { useOTAUpdate } from '@/hooks/useOTAUpdate';
import { useLanguageStore } from '@/stores/language.store';
import { useComplianceStore } from '@/stores/compliance.store';
import { StatusBar } from 'expo-status-bar';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 5 * 60 * 1000 },
    mutations: { retry: 0 },
  },
});

function parseUrlParams(url: string): {
  code: string | null;
  type: string | null;
} {
  const qs = url.split('?')[1]?.split('#')[0] ?? '';
  const frag = url.split('#')[1] ?? '';
  const p = new URLSearchParams(qs || frag);
  return {
    code: p.get('code'),
    type: p.get('type'),
  };
}

function isAuthCallbackUrl(url: string | null): boolean {
  return !!url && url.includes('auth/callback');
}

// Set to true while DeepLinkHandler is processing a magic link so AuthStateSync
// and NavigationGuard don't interfere during session setup.
// True while DeepLinkHandler owns session setup — guards and sync must not interfere.
let deepLinkProcessing = false;

// ─── DeepLinkHandler ─────────────────────────────────────────────────────────
// Handles Supabase PKCE magic links (cold-start and warm-start).
// Two paths:
//   A) Collector invitation link (invitation_token in user_metadata) → PIN screen
//   B) All other links (parent, school, recovery) → resolved by role
function DeepLinkHandler() {
  const loginAction = useAuthStore(s => s.login);
  const router = useRouter();
  const codeHandled = useRef<string | null>(null);

  const processUrl = useCallback(
    async (url: string | null) => {
      if (!isAuthCallbackUrl(url)) return;
      const { code, type } = parseUrlParams(url!);
      if (!code) return;
      if (codeHandled.current === code) return;
      codeHandled.current = code;

      deepLinkProcessing = true;
      router.replace('/(auth)/callback' as any);

      try {
        const { data, error } =
          await supabase.auth.exchangeCodeForSession(code);

        if (error || !data.session) {
          Toast.show('Lien expiré ou déjà utilisé. Demandez un nouveau lien.', {
            type: 'error',
            duration: 6000,
          });
          deepLinkProcessing = false;
          router.replace('/(auth)/collector-pin' as any);
          return;
        }

        const authUser = data.session.user;
        const meta = authUser.user_metadata ?? {};
        const invitationToken = (meta.invitation_token as string) || null;

        // ── Path A: collector invitation ───────────────────────────────────
        if (invitationToken) {
          // Upsert profile so mapSupabaseSessionToAuthSession resolves role=collector
          await supabase.from('user_profiles').upsert(
            {
              user_id: authUser.id,
              first_name: (meta.first_name as string) || '',
              last_name: (meta.last_name as string) || '',
              role: 'collector',
            },
            { onConflict: 'user_id', ignoreDuplicates: true }
          );

          const session = await mapSupabaseSessionToAuthSession(data.session);
          loginAction(session);
          deepLinkProcessing = false;
          router.replace({
            pathname: '/(auth)/collector-pin' as any,
            params: { invitation_token: invitationToken },
          });
          return;
        }

        // ── Path B: all other links ────────────────────────────────────────
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
              phone: existingProfile.phone
                ? String(existingProfile.phone)
                : undefined,
              school_id: existingProfile.school_id
                ? String(existingProfile.school_id)
                : undefined,
              role: existingProfile.role as any,
            }
          : null;

        if (!knownProfile) {
          const metaRole = (meta.role as string) ?? 'parent';
          let schoolId: string | undefined;

          if (metaRole === 'school_admin') {
            // Try to insert the school. If it already exists (admin_user_id or email
            // unique constraint violation — e.g. user clicked the confirmation link
            // twice), fall back to reading the existing row so the profile gets a
            // valid school_id instead of being created orphaned.
            const { data: inserted, error: insertErr } = await supabase
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

            if (inserted?.id) {
              schoolId = String(inserted.id);
            } else if (insertErr) {
              // Duplicate — read the existing school for this admin
              const { data: existing } = await supabase
                .from('schools')
                .select('id')
                .eq('admin_user_id', authUser.id)
                .maybeSingle();
              schoolId = existing?.id ? String(existing.id) : undefined;
            }
          }

          const { data: inserted } = await supabase
            .from('user_profiles')
            .insert({
              user_id: authUser.id,
              first_name:
                (meta.manager_first_name as string) ||
                (meta.first_name as string) ||
                '',
              last_name:
                (meta.manager_last_name as string) ||
                (meta.last_name as string) ||
                '',
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
              school_id: inserted.school_id
                ? String(inserted.school_id)
                : undefined,
              role: inserted.role as any,
            };
          }
        }

        const session = await mapSupabaseSessionToAuthSession(
          data.session,
          knownProfile
        );
        loginAction(session);
        const role = session.user.role;
        deepLinkProcessing = false;

        if (type === 'recovery') {
          router.replace('/(auth)/reset-password' as any);
        } else if (role === 'collector') {
          router.replace('/(auth)/collector-pin' as any);
        } else if (role === 'school_admin' || role === 'staff') {
          router.replace('/(school-tabs)/home' as any);
        } else {
          router.replace('/(parent-tabs)' as any);
        }
      } catch {
        deepLinkProcessing = false;
        router.replace('/(auth)/login' as any);
      }
    },
    [loginAction, router]
  );

  useEffect(() => {
    Linking.getInitialURL().then(url => processUrl(url));
  }, [processUrl]);

  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) =>
      processUrl(url)
    );
    return () => subscription.remove();
  }, [processUrl]);

  return null;
}

// ─── AuthStateSync ────────────────────────────────────────────────────────────
// Syncs Supabase token refresh / signout into the store.
// Skips SIGNED_IN events fired by DeepLinkHandler (it handles those itself).
function AuthStateSync() {
  const loginAction = useAuthStore(s => s.login);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, sess) => {
      if (__DEV__)
        console.log(
          '[AuthStateSync] event=',
          event,
          'deepLink=',
          deepLinkProcessing,
          'pwdLogin=',
          passwordLoginInProgress
        );
      if (event === 'INITIAL_SESSION') return;
      if (
        event === 'SIGNED_IN' &&
        (deepLinkProcessing ||
          passwordLoginInProgress ||
          collectorPinLoginInProgress)
      )
        return;
      if (event === 'SIGNED_OUT') {
        // Only clear session on an explicit user-triggered logout.
        // Supabase fires SIGNED_OUT spuriously on 401s from background requests
        // (e.g. a Realtime channel reconnect with an expired token) — ignore those.
        if (explicitLogoutInProgress) {
          useComplianceStore.getState().reset();
          useAuthStore.setState({ session: null });
        }
        return;
      }
      if (!sess) return;
      if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
        const session = await mapSupabaseSessionToAuthSession(sess);
        if (__DEV__)
          console.log('[AuthStateSync] loginAction role=', session.user.role);
        loginAction(session);
      }
    });
    return () => subscription.unsubscribe();
  }, [loginAction]);

  return null;
}

// ─── NavigationGuard ──────────────────────────────────────────────────────────
// Single source of truth for routing.
// lastRedirect prevents redirect loops: we only redirect if the target differs
// from what we already navigated to. Resets when auth state changes.
function NavigationGuard() {
  const router = useRouter();
  const segments = useSegments();
  const isAuthenticated = useIsAuthenticated();
  const isRestoring = useIsRestoring();
  const pinVerified = useCollectorSessionStore(s => s.isVerified);
  const pinRestoring = useCollectorSessionStore(s => s.isRestoring);

  const lastRedirectRef = useRef<string | null>(null);
  const prevAuthRef = useRef(isAuthenticated);

  // Reset lastRedirect when auth state flips — new session needs fresh routing.
  if (prevAuthRef.current !== isAuthenticated) {
    lastRedirectRef.current = null;
    prevAuthRef.current = isAuthenticated;
  }

  useEffect(() => {
    if (__DEV__)
      console.log(
        '[Guard] effect | isRestoring=',
        isRestoring,
        'pinRestoring=',
        pinRestoring,
        'deepLink=',
        deepLinkProcessing,
        'auth=',
        isAuthenticated,
        'seg=',
        segments[0],
        segments[1]
      );

    if (isRestoring || pinRestoring || deepLinkProcessing) return;

    const seg = segments[0] as string | undefined;
    if (!seg) {
      if (__DEV__) console.log('[Guard] no seg, skip');
      return;
    }

    const inAuth = seg === '(auth)';
    const sub1 = segments[1] as string | undefined;
    if (inAuth && (sub1 === 'callback' || sub1 === 'reset-password')) return;

    const inPinScreen = inAuth && sub1 === 'collector-pin';
    const role = useAuthStore.getState().session?.user.role;

    let target: string | null = null;

    if (!isAuthenticated) {
      if (!inAuth) target = '/(auth)/login';
    } else if (role === 'collector') {
      if (!pinVerified && !inPinScreen) {
        target = '/(auth)/collector-pin';
      } else if (pinVerified && (inAuth || seg !== '(collector-tabs)')) {
        target = '/(collector-tabs)/home';
      }
    } else if (role === 'school_admin' || role === 'staff') {
      if (
        inAuth ||
        seg === '(app)' ||
        seg === '(parent-tabs)' ||
        seg === '(collector-tabs)'
      ) {
        target = '/(school-tabs)/home';
      }
    } else {
      // parent / default
      if (
        inAuth ||
        seg === '(app)' ||
        seg === '(collector-tabs)' ||
        seg === '(school-tabs)'
      ) {
        target = '/(parent-tabs)';
      }
    }

    if (__DEV__)
      console.log(
        '[Guard] role=',
        role,
        'target=',
        target,
        'lastRedirect=',
        lastRedirectRef.current,
        'seg=',
        seg
      );

    if (!target) return;
    if (target === lastRedirectRef.current) {
      if (__DEV__) console.log('[Guard] skipped — same as lastRedirect');
      return;
    }

    if (__DEV__) console.log('[Guard] → router.replace', target);
    lastRedirectRef.current = target;
    router.replace(target as any);
  }, [
    isAuthenticated,
    isRestoring,
    pinRestoring,
    pinVerified,
    segments,
    router,
  ]);

  return null;
}

// Registers push token + wires foreground/response listeners after login
function NotificationBootstrap() {
  const session = useSession();
  const userId = session?.user.id;
  const router = useRouter();
  useUnreadCountQuery();

  useEffect(() => {
    if (!userId) return;

    let tokenRegistered = false;

    registerPushToken()
      .then(() => {
        tokenRegistered = true;
      })
      .catch(err => {
        if (__DEV__)
          console.error(
            '[NotificationBootstrap] push token registration failed',
            err
          );
      });

    const foregroundSub = addForegroundNotificationListener(() => {
      // Badge is updated via realtime store; toast already shown by system
    });

    const responseSub = addNotificationResponseListener(response => {
      const data = response.notification.request.content.data as Record<
        string,
        unknown
      >;
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
  const initCollectorSession = useCollectorSessionStore(s => s.initialize);
  const initLanguage = useLanguageStore(s => s.initialize);

  useOTAUpdate();

  useEffect(() => {
    initLanguage();
    initCollectorSession();
    Linking.getInitialURL().then(url => {
      if (isAuthCallbackUrl(url)) {
        useAuthStore.setState({ isRestoring: false });
      } else {
        initialize();
      }
    });
  }, [initialize, initCollectorSession, initLanguage]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="auto" translucent />
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme={ThemeMode.Light}>
          <ToastProviderWithViewport>
            <DeepLinkHandler />
            <AuthStateSync />
            <NavigationGuard />
            <NotificationBootstrap />
            <NotificationCenterModal />
            <NetworkBanner />
            <Slot />
          </ToastProviderWithViewport>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
