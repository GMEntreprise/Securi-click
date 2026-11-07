import { create } from 'zustand';
import { queryClient } from '@/lib/queryClient';
import {
  clearPersistedQueryCache,
  restoreQueryCache,
  setPersistenceOwner,
} from '@/lib/offline/queryPersistence';
import { useComplianceStore } from '@/stores/compliance.store';
import { useNotificationStore } from '@/features/notifications/stores/notification.store';
import { useCollectorSessionStore } from '@/features/collector/stores/collectorSession.store';
import { isDemoActive, useDemoStore } from '@/features/demo/store/demo.store';
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
  await Promise.all([
    useCollectorSessionStore.getState().clear(),
    clearPersistedQueryCache(),
  ]);
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  session: null,
  isLoading: false,
  isRestoring: true,

  initialize: async () => {
    try {
      const session = await authService.restoreSession();
      if (session) await restoreQueryCache(session.user.id);
      set({ session: session ?? null, isRestoring: false });
    } catch {
      set({ isRestoring: false });
    }
  },

  login: session => {
    const previousUserId = get().session?.user.id ?? null;
    if (shouldResetQueryCache(previousUserId, session.user.id)) {
      if (!isDemoActive()) {
        queryClient.cancelQueries();
        queryClient.clear();
        useNotificationStore.getState().reset();
      }
      clearPersistedQueryCache();
    }
    setPersistenceOwner(session.user.id);
    set({ session, isLoading: false });
  },

  logout: async () => {
    if (isDemoActive()) {
      await leaveDemo();
      return;
    }
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
    if (isDemoActive()) {
      await leaveDemo();
      return;
    }
    await discardUserData();
    set({ session: null, isLoading: false });
  },

  setLoading: isLoading => set({ isLoading }),
}));

export async function leaveDemo(): Promise<void> {
  useDemoStore.getState().exit();
  const realUserId = useAuthStore.getState().session?.user.id;
  if (realUserId) await restoreQueryCache(realUserId);
}

export const useSession = () => {
  const demoSession = useDemoStore(s => s.session);
  const realSession = useAuthStore(s => s.session);
  return demoSession ?? realSession;
};
export const useIsAuthenticated = () => {
  const inDemo = useDemoStore(s => s.session !== null);
  const signedIn = useAuthStore(s => !!s.session);
  return inDemo || signedIn;
};
export const useIsLoading = () =>
  useAuthStore(s => s.isLoading || s.isRestoring);
export const useAuthLoading = useIsLoading;
export const useIsRestoring = () => useAuthStore(s => s.isRestoring);
export const useUserRole = () => useSession()?.user.role;
