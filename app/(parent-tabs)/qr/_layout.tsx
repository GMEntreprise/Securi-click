import { Stack } from 'expo-router';
import { useTheme } from '@/theme';

export default function ParentQrLayout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: '',
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
    </Stack>
  );
}
