import { create } from 'zustand';
import { queryClient } from '@/lib/queryClient';
import type { AuthSession, AuthStateSlice } from '../types';
import { authService } from '../services/supabaseAuth.service';

interface AuthActions {
  initialize: () => Promise<void>;
  setSession: (session: AuthSession | null) => void;
  login: (session: AuthSession) => void;
  logout: () => Promise<void>;
  setLoading: (isLoading: boolean) => void;
}

let authSubscription: { unsubscribe: () => void } | null = null;

export const useAuthStore = create<AuthStateSlice & AuthActions>(set => ({
  session: null,
  isLoading: false,
  isRestoring: true,

  initialize: async () => {
    set({ isRestoring: true });
    try {
      const session = await authService.restoreSession();
      set({ session });

      if (!authSubscription) {
        authSubscription = authService.subscribeAuth(next => {
          set({ session: next });
        });
      }
    } finally {
      set({ isRestoring: false });
    }
  },

  setSession: session => set({ session }),

  login: session => set({ session, isLoading: false }),

  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.signOut();
      set({ session: null });
      queryClient.removeQueries({ queryKey: ['user'] });
    } finally {
      set({ isLoading: false });
    }
  },

  setLoading: isLoading => set({ isLoading }),
}));

export const useSession = () => useAuthStore(s => s.session);
export const useIsAuthenticated = () => useAuthStore(s => !!s.session);
export const useAuthLoading = () =>
  useAuthStore(s => s.isLoading || s.isRestoring);

/** Alias explicite : chargement mutation ou restauration session */
export const useIsLoading = () =>
  useAuthStore(s => s.isLoading || s.isRestoring);

export const useIsRestoring = () => useAuthStore(s => s.isRestoring);
export const useUserRole = () => useAuthStore(s => s.session?.user.role);
