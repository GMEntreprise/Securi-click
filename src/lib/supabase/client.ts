import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import 'react-native-url-polyfill/auto';
import type { Session } from '@supabase/supabase-js';
import { createPolicyFetch } from '@/lib/network/requestPolicy';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

const secureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: secureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
  global: { fetch: createPolicyFetch(fetch) },
});

const STORAGE_KEY = `sb-${new URL(supabaseUrl || 'http://localhost').hostname.split('.')[0]}-auth-token`;

export async function readStoredSession(): Promise<Session | null> {
  try {
    const raw = await SecureStore.getItemAsync(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Session;
    return session.access_token && session.user ? session : null;
  } catch {
    return null;
  }
}
