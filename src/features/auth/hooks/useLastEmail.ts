import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

const KEY = 'securiclick_last_email';

export function saveLastEmail(email: string) {
  if (email?.trim()) {
    SecureStore.setItemAsync(KEY, email.trim().toLowerCase()).catch(() => {});
  }
}

export function useLastEmail(): string {
  const [email, setEmail] = useState('');
  useEffect(() => {
    SecureStore.getItemAsync(KEY)
      .then(v => { if (v) setEmail(v); })
      .catch(() => {});
  }, []);
  return email;
}
