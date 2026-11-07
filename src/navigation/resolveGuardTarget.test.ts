import { describe, expect, it } from '@jest/globals';
import { resolveGuardTarget } from './resolveGuardTarget';

const base = {
  isAuthenticated: false,
  role: undefined,
  pinVerified: false,
  demoRole: null,
} as const;

describe('resolveGuardTarget — production', () => {
  it('sends a visitor without session to login', () => {
    expect(resolveGuardTarget({ ...base, seg: '(parent-tabs)' })).toBe(
      '/(auth)/login'
    );
    expect(
      resolveGuardTarget({ ...base, seg: '(auth)', sub1: 'login' })
    ).toBeNull();
  });

  it('routes each role to its own space', () => {
    expect(
      resolveGuardTarget({
        ...base,
        isAuthenticated: true,
        role: 'parent',
        seg: '(auth)',
      })
    ).toBe('/(parent-tabs)');
    expect(
      resolveGuardTarget({
        ...base,
        isAuthenticated: true,
        role: 'parent',
        seg: '(school-tabs)',
      })
    ).toBe('/(parent-tabs)');
    expect(
      resolveGuardTarget({
        ...base,
        isAuthenticated: true,
        role: 'staff',
        seg: '(parent-tabs)',
      })
    ).toBe('/(school-tabs)/home');
    expect(
      resolveGuardTarget({
        ...base,
        isAuthenticated: true,
        role: 'school_admin',
        seg: '(school-tabs)',
      })
    ).toBeNull();
  });

  it('keeps a collector behind the PIN', () => {
    expect(
      resolveGuardTarget({
        ...base,
        isAuthenticated: true,
        role: 'collector',
        seg: '(collector-tabs)',
      })
    ).toBe('/(auth)/collector-pin');
    expect(
      resolveGuardTarget({
        ...base,
        isAuthenticated: true,
        role: 'collector',
        seg: '(auth)',
        sub1: 'collector-pin',
      })
    ).toBeNull();
    expect(
      resolveGuardTarget({
        ...base,
        isAuthenticated: true,
        role: 'collector',
        pinVerified: true,
        seg: '(auth)',
      })
    ).toBe('/(collector-tabs)/home');
  });

  it('leaves the auth callback screens alone', () => {
    expect(
      resolveGuardTarget({
        ...base,
        isAuthenticated: true,
        role: 'parent',
        seg: '(auth)',
        sub1: 'callback',
      })
    ).toBeNull();
    expect(
      resolveGuardTarget({ ...base, seg: '(auth)', sub1: 'reset-password' })
    ).toBeNull();
  });
});

describe('resolveGuardTarget — demo', () => {
  it('lets anyone reach the demo entry, with or without an account', () => {
    expect(resolveGuardTarget({ ...base, seg: 'demo' })).toBeNull();
    expect(
      resolveGuardTarget({
        ...base,
        isAuthenticated: true,
        role: 'parent',
        seg: 'demo',
      })
    ).toBeNull();
  });

  it('keeps each demo role inside its own tabs, whatever the real account', () => {
    expect(
      resolveGuardTarget({ ...base, demoRole: 'parent', seg: '(parent-tabs)' })
    ).toBeNull();
    expect(
      resolveGuardTarget({
        ...base,
        demoRole: 'establishment',
        seg: '(parent-tabs)',
      })
    ).toBe('/(school-tabs)/home');
    expect(
      resolveGuardTarget({
        ...base,
        demoRole: 'collector',
        seg: '(school-tabs)',
      })
    ).toBe('/(collector-tabs)/home');
    expect(
      resolveGuardTarget({
        ...base,
        isAuthenticated: true,
        role: 'school_admin',
        demoRole: 'parent',
        seg: '(school-tabs)',
      })
    ).toBe('/(parent-tabs)');
  });

  it('never asks for a PIN in the collector demo', () => {
    expect(
      resolveGuardTarget({
        ...base,
        demoRole: 'collector',
        seg: '(collector-tabs)',
      })
    ).toBeNull();
  });

  it('never gives a demo visitor access to the auth screens', () => {
    expect(
      resolveGuardTarget({
        ...base,
        demoRole: 'parent',
        seg: '(auth)',
        sub1: 'login',
      })
    ).toBe('/(parent-tabs)');
  });
});
