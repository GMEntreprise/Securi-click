import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {
  useIsAuthenticated,
  useIsRestoring,
  useUserRole,
} from '@/features/auth/store/auth.store';
import { SplashAnimationScreen } from '@/features/onboarding/components/SplashAnimationScreen';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function Index() {
  const isAuthenticated = useIsAuthenticated();
  const isRestoring = useIsRestoring();
  const role = useUserRole();

  useEffect(() => {
    if (!isRestoring) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isRestoring]);

  if (isRestoring) {
    return <SplashAnimationScreen />;
  }

  if (isAuthenticated) {
    if (role === 'collector')
      return <Redirect href={'/(collector-tabs)/home' as any} />;
    if (role === 'school_admin' || role === 'staff')
      return <Redirect href={'/(school-tabs)/home' as any} />;
    return <Redirect href={'/(parent-tabs)' as any} />;
  }

  return <Redirect href={'/(auth)/login' as any} />;
}
