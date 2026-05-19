import { Stack } from 'expo-router';

// Navigation away from (auth) is handled by NavigationGuard in _layout.tsx
// which routes each role to its own dashboard. No redirect logic here.
export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="parent" options={{ headerShown: false }} />
      <Stack.Screen name="school" options={{ headerShown: false }} />
      <Stack.Screen name="collector" options={{ headerShown: false }} />
      <Stack.Screen name="collector-pin" options={{ headerShown: false }} />
      <Stack.Screen name="callback" options={{ headerShown: false }} />
      <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
      <Stack.Screen name="reset-password" options={{ headerShown: false }} />
    </Stack>
  );
}
