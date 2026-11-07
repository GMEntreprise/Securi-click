import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockGetSession = jest.fn<() => Promise<unknown>>();
const mockRefreshSession = jest.fn<() => Promise<unknown>>();
const mockSignOut = jest.fn<() => Promise<unknown>>();
const mockReadStored = jest.fn<() => Promise<unknown>>();
const mockMap =
  jest.fn<(session: { user: { id: string } }) => Promise<unknown>>();

jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      refreshSession: () => mockRefreshSession(),
      signOut: () => mockSignOut(),
    },
  },
  readStoredSession: () => mockReadStored(),
}));
jest.mock('../utils/mapAuthSession', () => ({
  mapSupabaseSessionToAuthSession: (session: { user: { id: string } }) =>
    mockMap(session),
}));
jest.mock('@/features/school/directory', () => ({ directoryService: {} }));

import { AuthRetryableFetchError, AuthApiError } from '@supabase/supabase-js';
import { authService } from './supabaseAuth.service';

const FUTURE = Math.floor(Date.now() / 1000) + 3600;
const PAST = Math.floor(Date.now() / 1000) - 3600;
const stored = (expires_at: number) => ({
  access_token: 'a',
  refresh_token: 'r',
  expires_at,
  user: { id: 'user-1' },
});

describe('restoreSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMap.mockImplementation(async session => ({
      user: { id: session.user.id },
    }));
  });

  it('restores a valid session', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: stored(FUTURE) },
      error: null,
    });
    await expect(authService.restoreSession()).resolves.toEqual({
      user: { id: 'user-1' },
    });
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it('returns nothing when no account is stored', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
    mockReadStored.mockResolvedValue(null);
    await expect(authService.restoreSession()).resolves.toBeNull();
  });

  it('keeps the account when the token expired while offline', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: new AuthRetryableFetchError('Network request failed', 0),
    });
    mockReadStored.mockResolvedValue(stored(PAST));
    await expect(authService.restoreSession()).resolves.toEqual({
      user: { id: 'user-1' },
    });
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it('keeps the account when an explicit refresh fails on the network', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: stored(PAST) },
      error: null,
    });
    mockRefreshSession.mockResolvedValue({
      data: { session: null },
      error: new AuthRetryableFetchError('Network request failed', 0),
    });
    mockReadStored.mockResolvedValue(stored(PAST));
    await expect(authService.restoreSession()).resolves.toEqual({
      user: { id: 'user-1' },
    });
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it('signs out when the server rejects the refresh token', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: stored(PAST) },
      error: null,
    });
    mockRefreshSession.mockResolvedValue({
      data: { session: null },
      error: new AuthApiError(
        'Invalid Refresh Token',
        400,
        'refresh_token_not_found'
      ),
    });
    await expect(authService.restoreSession()).resolves.toBeNull();
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it('never resurrects a session the server revoked', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: new AuthApiError(
        'Invalid Refresh Token',
        400,
        'refresh_token_not_found'
      ),
    });
    await expect(authService.restoreSession()).resolves.toBeNull();
    expect(mockReadStored).not.toHaveBeenCalled();
  });

  it('starts from the device when the network never answers', async () => {
    jest.useFakeTimers();
    mockGetSession.mockReturnValue(new Promise(() => {}));
    mockReadStored.mockResolvedValue(stored(PAST));
    const pending = authService.restoreSession();
    await jest.advanceTimersByTimeAsync(4_000);
    await expect(pending).resolves.toEqual({ user: { id: 'user-1' } });
    expect(mockSignOut).not.toHaveBeenCalled();
    jest.useRealTimers();
  });
});
