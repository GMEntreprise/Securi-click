import { Stack } from 'expo-router';
import {
  useIsAuthenticated,
  useIsLoading,
} from '@/features/auth/store/auth.store';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export default function AuthLayout() {
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useIsLoading();

  // Show loading screen while restoring session
  if (isLoading) {
    return <LoadingScreen message="Chargement..." />;
  }

  // Redirect authenticated users to app
  if (isAuthenticated) {
    return null; // Will be handled by root layout
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
    </Stack>
  );
}
