import { Redirect } from 'expo-router';
import {
  useIsAuthenticated,
  useIsRestoring,
  useUserRole,
} from '@/features/auth/store/auth.store';
import { View, ActivityIndicator } from 'react-native';
import { useTheme } from '@/theme';

export default function Index() {
  const isAuthenticated = useIsAuthenticated();
  const isRestoring = useIsRestoring();
  const role = useUserRole();
  const theme = useTheme();

  if (isRestoring) {
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

  if (isAuthenticated) {
    if (role === 'collector')
      return <Redirect href={'/(collector-tabs)' as any} />;
    if (role === 'school_admin' || role === 'staff')
      return <Redirect href={'/(school-tabs)/home' as any} />;
    return <Redirect href={'/(parent-tabs)' as any} />;
  }

  return <Redirect href={'/(auth)/login' as any} />;
}
