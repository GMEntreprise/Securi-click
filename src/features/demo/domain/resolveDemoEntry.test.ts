import { describe, expect, it } from '@jest/globals';
import { resolveDemoEntry } from './resolveDemoEntry';

describe('resolveDemoEntry', () => {
  it('opens the establishment home from the printed stand', () => {
    expect(resolveDemoEntry(['etablissement'])).toEqual({
      role: 'establishment',
      href: '/(school-tabs)/home',
    });
  });

  it('opens the parent collectors screen from the printed stand', () => {
    expect(resolveDemoEntry(['parent', 'collecteurs'])).toEqual({
      role: 'parent',
      href: '/(parent-tabs)/children',
    });
  });

  it('opens the role homes', () => {
    expect(resolveDemoEntry(['parent'])).toEqual({
      role: 'parent',
      href: '/(parent-tabs)',
    });
    expect(resolveDemoEntry(['collecteur'])).toEqual({
      role: 'collector',
      href: '/(collector-tabs)/home',
    });
  });

  it.each([
    [[]],
    [['admin']],
    [['parent', 'nope']],
    [['etablissement', 'x', 'y']],
    [['../../(auth)']],
  ])('falls back to the role choice for %j', path => {
    expect(resolveDemoEntry(path)).toBeNull();
  });
});
