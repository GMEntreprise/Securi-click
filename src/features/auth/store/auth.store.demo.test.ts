import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockSignOut = jest.fn<() => Promise<void>>();
jest.mock('../services/supabaseAuth.service', () => ({
  authService: { signOut: () => mockSignOut() },
}));
jest.mock('@/lib/offline/queryPersistence', () => ({
  clearPersistedQueryCache: jest.fn(async () => undefined),
  restoreQueryCache: jest.fn(async () => undefined),
  setPersistenceOwner: jest.fn(),
}));

import { renderHook } from '@testing-library/react-native';
import { useDemoStore } from '@/features/demo/store/demo.store';
import {
  leaveDemo,
  useAuthStore,
  useIsAuthenticated,
  useSession,
  useUserRole,
} from './auth.store';
import type { AuthSession } from '../types';

const real = {
  user: { id: 'real-user', email: 'real@example.test', role: 'school_admin' },
  access_token: 'token',
  refresh_token: 'refresh',
  expires_at: 0,
} as unknown as AuthSession;

describe('demo and real sessions', () => {
  beforeEach(() => {
    mockSignOut.mockReset();
    mockSignOut.mockResolvedValue(undefined);
    useDemoStore.getState().exit();
    useAuthStore.setState({ session: real, isRestoring: false });
  });

  it('shows the demo identity while the demo runs', () => {
    useDemoStore.getState().enter('parent');
    expect(renderHook(() => useSession()).result.current?.user.id).toBe(
      'demo-parent'
    );
    expect(renderHook(() => useUserRole()).result.current).toBe('parent');
    expect(renderHook(() => useIsAuthenticated()).result.current).toBe(true);
  });

  it('leaves the real session stored underneath', () => {
    useDemoStore.getState().enter('parent');
    expect(useAuthStore.getState().session?.user.id).toBe('real-user');
  });

  it('gives back the real account when the demo ends', async () => {
    useDemoStore.getState().enter('parent');
    await leaveDemo();
    expect(renderHook(() => useSession()).result.current?.user.id).toBe(
      'real-user'
    );
  });

  it('turns a logout during the demo into leaving the demo', async () => {
    useDemoStore.getState().enter('collector');
    await useAuthStore.getState().logout();
    expect(mockSignOut).not.toHaveBeenCalled();
    expect(useDemoStore.getState().role).toBeNull();
    expect(useAuthStore.getState().session?.user.id).toBe('real-user');
  });

  it('turns an account deletion during the demo into leaving the demo', async () => {
    useDemoStore.getState().enter('parent');
    await useAuthStore.getState().clearSession();
    expect(useDemoStore.getState().role).toBeNull();
    expect(useAuthStore.getState().session?.user.id).toBe('real-user');
  });

  it('still signs out for real outside the demo', async () => {
    await useAuthStore.getState().logout();
    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().session).toBeNull();
  });
});
