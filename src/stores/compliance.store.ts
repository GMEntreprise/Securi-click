import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase/client';

const WELCOME_KEY = 'has-seen-welcome-v1';

interface ComplianceState {
  // Local flag — set before any account exists, persisted in AsyncStorage
  hasSeenWelcome: boolean | null;
  // DB flag — synced after login for existing accounts
  hasSeenCompliance: boolean | null;
  isLoading: boolean;

  // Load local welcome flag at app start (no userId needed)
  initializeLocal: () => Promise<void>;
  // Mark welcome as seen locally (called when user taps "Continuer" on RoleChoiceScreen)
  acceptWelcome: () => Promise<void>;
  // Sync compliance state from DB after login (existing accounts)
  initialize: (userId: string) => Promise<void>;
  // Write compliance to DB after login
  accept: (userId: string) => Promise<void>;
  // Reset on logout
  reset: () => void;
}

export const useComplianceStore = create<ComplianceState>(set => ({
  hasSeenWelcome: null,
  hasSeenCompliance: null,
  isLoading: false,

  initializeLocal: async () => {
    try {
      const stored = await AsyncStorage.getItem(WELCOME_KEY);
      set({ hasSeenWelcome: stored === 'true' });
    } catch {
      set({ hasSeenWelcome: false });
    }
  },

  acceptWelcome: async () => {
    set({ hasSeenWelcome: true });
    try {
      await AsyncStorage.setItem(WELCOME_KEY, 'true');
    } catch {}
  },

  initialize: async (userId: string) => {
    set({ isLoading: true });
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('has_seen_compliance')
        .eq('user_id', userId)
        .single();
      set({
        hasSeenCompliance: data?.has_seen_compliance ?? false,
        isLoading: false,
      });
    } catch {
      set({ hasSeenCompliance: false, isLoading: false });
    }
  },

  accept: async (userId: string) => {
    set({ hasSeenCompliance: true });
    await supabase
      .from('user_profiles')
      .update({
        has_seen_compliance: true,
        compliance_accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
  },

  reset: () => set({ hasSeenCompliance: null, isLoading: false }),
}));

export const useHasSeenWelcome = () =>
  useComplianceStore(s => s.hasSeenWelcome);
export const useHasSeenCompliance = () =>
  useComplianceStore(s => s.hasSeenCompliance);
export const useComplianceLoading = () => useComplianceStore(s => s.isLoading);
