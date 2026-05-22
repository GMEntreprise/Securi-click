import { Stack } from 'expo-router';
import { useTheme } from '@/theme';

export default function HistoryLayout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: '',
        headerBackButtonDisplayMode: 'minimal',
        headerTintColor: theme.accent,
        headerStyle: { backgroundColor: theme.card },
        headerShadowVisible: true,
        headerTitleStyle: {
          color: theme.text,
          fontWeight: '700',
          fontSize: 17,
        },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="archive"
        options={{ title: 'Archives', headerBackTitle: '' }}
      />
    </Stack>
  );
}
