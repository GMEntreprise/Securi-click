import { describe, expect, it } from '@jest/globals';
import {
  classifySupabaseError,
  supabaseErrorMessage,
  toUserFacingError,
} from './supabaseError';

describe('supabase error classification', () => {
  it('recognises a denied row-level-security check', () => {
    expect(classifySupabaseError({ code: '42501' })).toBe('permission_denied');
    expect(
      classifySupabaseError({ message: 'permission denied for table children' })
    ).toBe('permission_denied');
  });

  it('never puts a table or column name in front of the user', () => {
    const raw =
      'new row violates row-level security policy for table "guardians"';
    const shown = toUserFacingError({ message: raw }).message;
    expect(shown).not.toContain('guardians');
    expect(shown).not.toContain('row-level');
  });

  it('keeps transport problems distinguishable from data problems', () => {
    expect(classifySupabaseError({ message: 'Network request failed' })).toBe(
      'network'
    );
    expect(classifySupabaseError({ status: 429 })).toBe('rate_limit');
  });

  it('gives every category an actionable message', () => {
    for (const kind of [
      'rate_limit',
      'network',
      'weak_password',
      'invalid_email',
      'not_found',
      'permission_denied',
      'unknown',
    ] as const) {
      expect(supabaseErrorMessage(kind).trim().length).toBeGreaterThan(10);
    }
  });
});
