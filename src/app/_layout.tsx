import '../../global.css';
import { Stack } from 'expo-router';
import {
  ThemeProvider,
  DarkTheme,
  DefaultTheme,
} from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import { QueryProvider, SupabaseProvider } from '@/providers';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SupabaseProvider>
      <QueryProvider>
        <ThemeProvider
          value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
        >
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }} />
        </ThemeProvider>
      </QueryProvider>
    </SupabaseProvider>
  );
}
