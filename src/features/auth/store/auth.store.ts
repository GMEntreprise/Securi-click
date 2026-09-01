import { create } from 'zustand';
import { queryClient } from '@/lib/queryClient';
import { useComplianceStore } from '@/stores/compliance.store';
import { useNotificationStore } from '@/features/notifications/stores/notification.store';
import { useCollectorSessionStore } from '@/features/collector/stores/collectorSession.store';
import { authService } from '../services/supabaseAuth.service';
import { shouldResetQueryCache } from '../utils/sessionReset';
import type { AuthSession, AuthState } from '../types';

interface AuthActions {
  initialize: () => Promise<void>;
  login: (session: AuthSession) => void;
  logout: () => Promise<void>;
  clearSession: () => Promise<void>;
  setLoading: (isLoading: boolean) => void;
}

async function discardUserData(): Promise<void> {
  queryClient.cancelQueries();
  queryClient.clear();
  useComplianceStore.getState().reset();
  useNotificationStore.getState().reset();
  await useCollectorSessionStore.getState().clear();
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  session: null,
  isLoading: false,
  isRestoring: true,

  initialize: async () => {
    try {
      const session = await authService.restoreSession();
      set({ session: session ?? null, isRestoring: false });
    } catch {
      set({ isRestoring: false });
    }
  },

  login: session => {
    const previousUserId = get().session?.user.id ?? null;
    if (shouldResetQueryCache(previousUserId, session.user.id)) {
      queryClient.cancelQueries();
      queryClient.clear();
      useNotificationStore.getState().reset();
    }
    set({ session, isLoading: false });
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.signOut();
    } catch {
      /* empty */
    }
    await discardUserData();
    set({ session: null, isLoading: false });
  },

  clearSession: async () => {
    await discardUserData();
    set({ session: null, isLoading: false });
  },

  setLoading: isLoading => set({ isLoading }),
}));

export const useSession = () => useAuthStore(s => s.session);
export const useIsAuthenticated = () => useAuthStore(s => !!s.session);
export const useIsLoading = () =>
  useAuthStore(s => s.isLoading || s.isRestoring);
export const useAuthLoading = useIsLoading;
export const useIsRestoring = () => useAuthStore(s => s.isRestoring);
export const useUserRole = () => useAuthStore(s => s.session?.user.role);
