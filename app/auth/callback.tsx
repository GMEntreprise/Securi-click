import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore, useIsAuthenticated, useUserRole } from '@/features/auth/store/auth.store';
import { Toast } from '@/shared/ui/molecules/Toast';

// Shown while DeepLinkHandler (in _layout.tsx) processes the PKCE code.
// If auth completes normally, DeepLinkHandler calls router.replace() before
// the timeout fires. The timeout is a safety net for any silent failure.
export default function AuthCallbackScreen() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const role = useUserRole();

  // If the store already has a session (e.g. app was warm), redirect immediately
  useEffect(() => {
    if (!isAuthenticated) return;
    if (role === 'collector') {
      router.replace('/(collector-tabs)/home' as any);
    } else if (role === 'school_admin' || role === 'staff') {
      router.replace('/(school-tabs)/home' as any);
    } else {
      router.replace('/(parent-tabs)' as any);
    }
  }, [isAuthenticated, role, router]);

  // Safety-net: after 10 s with no auth, the link failed silently — send user back
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!useAuthStore.getState().session) {
        Toast.show('Lien expiré ou déjà utilisé. Demandez un nouveau lien.', {
          type: 'error',
          duration: 5000,
        });
        router.replace('/(auth)/collector' as any);
      }
    }, 10_000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
