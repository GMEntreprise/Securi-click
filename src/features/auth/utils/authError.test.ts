import { describe, expect, it } from '@jest/globals';
import { authErrorMessage, classifyAuthError } from './authError';

describe('auth error classification', () => {
  it.each([
    [{ status: 429 }, 'rate_limit'],
    [{ code: 'over_email_send_rate_limit' }, 'rate_limit'],
    [{ message: 'Email rate limit exceeded' }, 'rate_limit'],
    [{ message: 'Network request failed' }, 'network'],
    [{ message: 'Failed to fetch' }, 'network'],
    [{ message: 'Password should be at least 6 characters' }, 'weak_password'],
    [
      { message: 'Unable to validate email address: invalid format' },
      'invalid_email',
    ],
    [{ message: 'User not found' }, 'not_found'],
  ])('classifies %j', (error, expected) => {
    expect(classifyAuthError(error)).toBe(expected);
  });

  it('falls back to unknown rather than guessing', () => {
    expect(
      classifyAuthError({ message: 'duplicate key value violates constraint' })
    ).toBe('unknown');
    expect(classifyAuthError(null)).toBe('unknown');
    expect(classifyAuthError(undefined)).toBe('unknown');
    expect(classifyAuthError({})).toBe('unknown');
  });

  it('never leaks a database message to the person using the app', () => {
    const raw = 'duplicate key value violates unique constraint "users_pkey"';
    const shown = authErrorMessage(classifyAuthError({ message: raw }));
    expect(shown).not.toContain('constraint');
    expect(shown).not.toContain('key value');
    expect(shown.length).toBeGreaterThan(0);
  });

  it('gives every category an actionable message', () => {
    for (const kind of [
      'rate_limit',
      'network',
      'weak_password',
      'invalid_email',
      'not_found',
      'unknown',
      'permission_denied',
    ] as const) {
      expect(authErrorMessage(kind).trim().length).toBeGreaterThan(10);
    }
  });
});
