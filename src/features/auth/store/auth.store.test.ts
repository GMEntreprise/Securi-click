import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockSignOut = jest.fn<() => Promise<void>>();
jest.mock('../services/supabaseAuth.service', () => ({
  authService: { signOut: () => mockSignOut() },
}));

import { queryClient } from '@/lib/queryClient';
import { useNotificationStore } from '@/features/notifications/stores/notification.store';
import { useAuthStore } from './auth.store';
import type { AuthSession } from '../types';

const sessionFor = (id: string) =>
  ({
    user: { id, email: `${id}@example.test`, role: 'parent' },
    access_token: 'token',
    refresh_token: 'refresh',
    expires_at: 0,
  }) as unknown as AuthSession;

function seedUserData() {
  queryClient.setQueryData(['history', 'parent-1'], [{ id: 'pickup-1' }]);
  useNotificationStore.getState().setUnreadCount(4);
}

describe('auth store session teardown', () => {
  beforeEach(() => {
    mockSignOut.mockReset();
    mockSignOut.mockResolvedValue(undefined);
    queryClient.clear();
    useNotificationStore.getState().reset();
    useAuthStore.setState({ session: null, isLoading: false });
  });

  it('leaves no cached user data behind after logout', async () => {
    useAuthStore.getState().login(sessionFor('parent-1'));
    seedUserData();

    await useAuthStore.getState().logout();

    expect(queryClient.getQueryData(['history', 'parent-1'])).toBeUndefined();
    expect(useNotificationStore.getState().unreadCount).toBe(0);
    expect(useAuthStore.getState().session).toBeNull();
  });

  it('still clears local data when the server sign-out fails', async () => {
    useAuthStore.getState().login(sessionFor('parent-1'));
    seedUserData();
    mockSignOut.mockRejectedValue(new Error('network down'));

    await useAuthStore.getState().logout();

    expect(queryClient.getQueryData(['history', 'parent-1'])).toBeUndefined();
    expect(useAuthStore.getState().session).toBeNull();
  });

  it('drops the previous account data when another user signs in', () => {
    useAuthStore.getState().login(sessionFor('parent-1'));
    seedUserData();

    useAuthStore.getState().login(sessionFor('parent-2'));

    expect(queryClient.getQueryData(['history', 'parent-1'])).toBeUndefined();
    expect(useNotificationStore.getState().unreadCount).toBe(0);
    expect(useAuthStore.getState().session?.user.id).toBe('parent-2');
  });

  it('keeps the cache when the same account re-hydrates its session', () => {
    useAuthStore.getState().login(sessionFor('parent-1'));
    seedUserData();

    useAuthStore.getState().login(sessionFor('parent-1'));

    expect(queryClient.getQueryData(['history', 'parent-1'])).toEqual([
      { id: 'pickup-1' },
    ]);
  });

  it('clears everything when an account is deleted without a sign-out call', async () => {
    useAuthStore.getState().login(sessionFor('parent-1'));
    seedUserData();

    await useAuthStore.getState().clearSession();

    expect(queryClient.getQueryData(['history', 'parent-1'])).toBeUndefined();
    expect(useAuthStore.getState().session).toBeNull();
    expect(mockSignOut).not.toHaveBeenCalled();
  });
});
