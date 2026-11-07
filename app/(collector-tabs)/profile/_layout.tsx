import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';

export default function CollectorProfileLayout() {
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
        name="notifications"
        options={{ title: t('screen_notifications'), headerBackTitle: '' }}
      />
      <Stack.Screen
        name="IdentityVerificationSheet"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="legal-mentions"
        options={{ title: t('screen_legal'), headerBackTitle: '' }}
      />
      <Stack.Screen
        name="privacy-policy"
        options={{ title: t('screen_privacy'), headerBackTitle: '' }}
      />
      <Stack.Screen
        name="faq"
        options={{ title: t('screen_faq'), headerBackTitle: '' }}
      />
    </Stack>
  );
}
