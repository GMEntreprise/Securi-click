import { useEffect } from 'react';
import * as Updates from 'expo-updates';

export function useOTAUpdate(): void {
  useEffect(() => {
    if (__DEV__) return;
    if (!Updates.isEnabled) return;

    const timer = setTimeout(async () => {
      try {
        const result = await Updates.checkForUpdateAsync();
        if (!result.isAvailable) return;
        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync();
      } catch {
        // Silencieux — réseau indisponible, update invalide, etc.
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);
}
