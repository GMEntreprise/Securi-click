import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';

interface ComplianceState {
  // null = not yet loaded from DB, false = not accepted, true = accepted
  hasSeenCompliance: boolean | null;
  isLoading: boolean;
  // Called once after session is restored and user_id is known
  initialize: (userId: string) => Promise<void>;
  // Called when user taps "J'ai compris" in the sheet
  accept: (userId: string) => Promise<void>;
  // Reset local state on logout
  reset: () => void;
}

export const useComplianceStore = create<ComplianceState>(set => ({
  hasSeenCompliance: null,
  isLoading: false,

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
      // On error, assume not seen — safer to show than to skip
      set({ hasSeenCompliance: false, isLoading: false });
    }
  },

  accept: async (userId: string) => {
    // Optimistic update: mark locally before DB round-trip to avoid flash
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

// Selectors
export const useHasSeenCompliance = () =>
  useComplianceStore(s => s.hasSeenCompliance);
export const useComplianceLoading = () => useComplianceStore(s => s.isLoading);
