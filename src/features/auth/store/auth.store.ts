import { create } from 'zustand';
import { authService } from '../services/supabaseAuth.service';
import type { AuthSession, AuthState } from '../types';

interface AuthActions {
  initialize: () => void;
  login: (session: AuthSession) => void;
  logout: () => Promise<void>;
  setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState & AuthActions>(set => ({
  session: null,
  isLoading: false,
  isRestoring: true,

  initialize: () => {
    set({ isRestoring: false });
  },

  login: session => set({ session, isLoading: false }),

  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.signOut();
      set({ session: null, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  setLoading: isLoading => set({ isLoading }),
}));

// Selectors pour ZERO re-renders
export const useSession = () => useAuthStore(s => s.session);
export const useIsAuthenticated = () => useAuthStore(s => !!s.session);
export const useIsLoading = () =>
  useAuthStore(s => s.isLoading || s.isRestoring);
export const useAuthLoading = useIsLoading;
export const useIsRestoring = () => useAuthStore(s => s.isRestoring);
export const useUserRole = () => useAuthStore(s => s.session?.user.role);
