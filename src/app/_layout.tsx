import '../../global.css';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import {
  ThemeProvider,
  DarkTheme,
  DefaultTheme,
} from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import { QueryProvider, SupabaseProvider } from '@/providers';
import { StatusBar } from 'expo-status-bar';
import {
  useAuthStore,
  useIsAuthenticated,
  useIsRestoring,
} from '@/features/auth/store/auth.store';

function RootNavigation() {
  const initialize = useAuthStore(s => s.initialize);
  const isRestoring = useIsRestoring();
  const isAuthenticated = useIsAuthenticated();

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const colorScheme = useColorScheme();

  if (isRestoring) {
    return (
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colorScheme === 'dark' ? '#000' : '#fff',
          }}
        >
          <ActivityIndicator size="large" color="#208AEF" />
        </View>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={isAuthenticated}>
          <Stack.Screen name="(authenticated)" />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SupabaseProvider>
      <QueryProvider>
        <RootNavigation />
      </QueryProvider>
    </SupabaseProvider>
  );
}
