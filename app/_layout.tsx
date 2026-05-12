import '../global.css';
import { Stack } from 'expo-router';
import { QueryProvider, SupabaseProvider } from '@/providers';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <SupabaseProvider>
      <QueryProvider>
        <StatusBar style="auto" />
        <Stack>
          <Stack.Screen name="index" options={{ title: 'Home' }} />
        </Stack>
      </QueryProvider>
    </SupabaseProvider>
  );
}
