import { useCallback, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

const KEY = 'securiclick_notifications_enabled';

export function useNotificationPref(): {
  enabled: boolean;
  isRestoring: boolean;
  setEnabled: (value: boolean) => void;
} {
  const [enabled, setEnabledState] = useState(true);
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    SecureStore.getItemAsync(KEY)
      .then(v => {
        if (v !== null) setEnabledState(v === 'true');
      })
      .catch(() => {})
      .finally(() => setIsRestoring(false));
  }, []);

  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value);
    SecureStore.setItemAsync(KEY, String(value)).catch(() => {});
  }, []);

  return { enabled, isRestoring, setEnabled };
}
