import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';

export default function ChildrenLayout() {
  const { t } = useTranslation('common');
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
        name="[id]"
        options={{ title: t('screen_child'), headerBackTitle: '' }}
      />
      <Stack.Screen
        name="add"
        options={{
          title: t('screen_add_child'),
          presentation: 'modal',
          headerBackTitle: '',
        }}
      />
      <Stack.Screen
        name="guardian-edit"
        options={{ title: t('screen_edit_authorization'), headerBackTitle: '' }}
      />
      <Stack.Screen
        name="guardian-add"
        options={{
          title: t('screen_add_person'),
          presentation: 'modal',
          headerBackTitle: '',
        }}
      />
    </Stack>
  );
}
