import { Stack } from 'expo-router';
import { useTheme } from '@/theme';

export default function AuthorizedPersonsLayout() {
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
      <Stack.Screen
        name="add"
        options={{
          title: 'Ajouter une personne',
          presentation: 'modal',
          headerBackTitle: '',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{ title: "Modifier l'autorisation", headerBackTitle: '' }}
      />
    </Stack>
  );
}
