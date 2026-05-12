import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import {
  useIsAuthenticated,
  useIsLoading,
  useAuthStore,
} from '@/features/auth/store/auth.store';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export default function AppLayout() {
  const router = useRouter();
  const segments = useSegments();
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useIsLoading();
  const initialize = useAuthStore(s => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !isLoading && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && !isLoading && inAuthGroup) {
      router.replace('/(app)/dashboard');
    }
  }, [isAuthenticated, isLoading, segments, router]);

  if (isLoading) {
    return <LoadingScreen message="Chargement..." />;
  }

  return (
    <Stack>
      <Stack.Screen name="dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="children" options={{ headerShown: false }} />
      <Stack.Screen name="qr" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
    </Stack>
  );
}
