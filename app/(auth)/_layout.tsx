import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import {
  useIsAuthenticated,
  useIsLoading,
} from '@/features/auth/store/auth.store';
import { View, ActivityIndicator } from 'react-native';
import { useTheme } from '@/theme';

function LoadingView() {
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.bg,
      }}
    >
      <ActivityIndicator size="large" color={theme.accent} />
    </View>
  );
}

export default function AuthLayout() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useIsLoading();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/(parent-tabs)' as any);
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) return <LoadingView />;
  if (isAuthenticated) return null;

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="parent" options={{ headerShown: false }} />
      <Stack.Screen name="school" options={{ headerShown: false }} />
      <Stack.Screen name="collector" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
    </Stack>
  );
}
