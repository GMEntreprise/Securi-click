import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

const KEY_PARENT = 'securiclick_last_email';
const KEY_COLLECTOR = 'securiclick_last_collector_email';

export function saveLastEmail(email: string) {
  if (email?.trim()) {
    SecureStore.setItemAsync(KEY_PARENT, email.trim().toLowerCase()).catch(() => {});
  }
}

export function saveLastCollectorEmail(email: string) {
  if (email?.trim()) {
    SecureStore.setItemAsync(KEY_COLLECTOR, email.trim().toLowerCase()).catch(() => {});
  }
}

export function useLastEmail(): string {
  const [email, setEmail] = useState('');
  useEffect(() => {
    SecureStore.getItemAsync(KEY_COLLECTOR)
      .then(v => { if (v) setEmail(v); })
      .catch(() => {});
  }, []);
  return email;
}
