import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';

export function useHideSplash(): void {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);
}
