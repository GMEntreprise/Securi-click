import { describe, expect, it } from '@jest/globals';
import { resolveSessionRole } from './resolveSessionRole';

describe('session role resolution', () => {
  it('takes the role from the database profile', () => {
    expect(
      resolveSessionRole({
        profileRole: 'school_admin',
        profileFetchFailed: false,
      })
    ).toEqual({ status: 'resolved', role: 'school_admin', shouldCache: true });
  });

  it('reuses the last database-issued role when the profile cannot be fetched', () => {
    expect(
      resolveSessionRole({
        profileRole: null,
        cachedRole: 'school_admin',
        profileFetchFailed: true,
      })
    ).toEqual({ status: 'resolved', role: 'school_admin', shouldCache: false });
  });

  it('refuses to guess a role when the profile is unreachable and nothing was cached', () => {
    expect(
      resolveSessionRole({ profileRole: null, profileFetchFailed: true })
    ).toEqual({ status: 'unavailable' });
  });

  it('never falls back to a stale cache when the database answered', () => {
    expect(
      resolveSessionRole({
        profileRole: null,
        cachedRole: 'super_admin',
        profileFetchFailed: false,
      })
    ).toEqual({ status: 'unavailable' });
  });

  it('never silently downgrades an unknown role to parent', () => {
    expect(
      resolveSessionRole({ profileRole: 'wizard', profileFetchFailed: false })
    ).toEqual({ status: 'unavailable' });
  });

  it('rejects a cached value that is not a known role', () => {
    expect(
      resolveSessionRole({
        profileRole: null,
        cachedRole: 'wizard',
        profileFetchFailed: true,
      })
    ).toEqual({ status: 'unavailable' });
  });

  it.each(['parent', 'collector', 'staff', 'school_admin', 'super_admin'])(
    'accepts the known role %s',
    role => {
      expect(
        resolveSessionRole({ profileRole: role, profileFetchFailed: false })
      ).toEqual({ status: 'resolved', role, shouldCache: true });
    }
  );
});
