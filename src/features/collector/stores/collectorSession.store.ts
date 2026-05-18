import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const KEY_VERIFIED = 'securiclick_collector_pin_verified';
const KEY_VERSION = 'securiclick_collector_pin_version';

interface CollectorSessionState {
  isVerified: boolean;
  isRestoring: boolean;
  initialize: () => Promise<void>;
  markVerified: (version: number) => Promise<void>;
  clear: () => Promise<void>;
}

export const useCollectorSessionStore = create<CollectorSessionState>(set => ({
  isVerified: false,
  isRestoring: true,

  initialize: async () => {
    try {
      const v = await SecureStore.getItemAsync(KEY_VERIFIED);
      if (v) {
        const ts = parseInt(v, 10);
        const twelveHours = 12 * 60 * 60 * 1000;
        set({ isVerified: Date.now() - ts < twelveHours });
      }
    } catch {}
    set({ isRestoring: false });
  },

  markVerified: async (version: number) => {
    try {
      await Promise.all([
        SecureStore.setItemAsync(KEY_VERIFIED, Date.now().toString()),
        SecureStore.setItemAsync(KEY_VERSION, String(version)),
      ]);
    } catch {}
    set({ isVerified: true });
  },

  clear: async () => {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(KEY_VERIFIED),
        SecureStore.deleteItemAsync(KEY_VERSION),
      ]);
    } catch {}
    set({ isVerified: false });
  },
}));
