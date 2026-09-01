import { describe, expect, it } from '@jest/globals';
import { resolveSignUpOutcome } from './signUpOutcome';

describe('sign up outcome', () => {
  it('reports a created account when Supabase returns a session', () => {
    expect(
      resolveSignUpOutcome({
        user: { id: 'u1', identities: [{ id: 'i1' }] },
        session: { access_token: 'token' },
      })
    ).toBe('created');
  });

  it('reports a pending confirmation for a genuinely new account', () => {
    expect(
      resolveSignUpOutcome({
        user: { id: 'u1', identities: [{ id: 'i1' }] },
        session: null,
      })
    ).toBe('confirmation_pending');
  });

  it('never asserts an account exists when identities are stripped', () => {
    expect(
      resolveSignUpOutcome({
        user: { id: 'u1', identities: [] },
        session: null,
      })
    ).toBe('confirmation_pending');
  });

  it('treats a missing user as an unusable response', () => {
    expect(resolveSignUpOutcome({ user: null, session: null })).toBe(
      'unusable'
    );
    expect(resolveSignUpOutcome(null)).toBe('unusable');
  });

  it('tolerates a response without an identities field', () => {
    expect(resolveSignUpOutcome({ user: { id: 'u1' }, session: null })).toBe(
      'confirmation_pending'
    );
  });
});
