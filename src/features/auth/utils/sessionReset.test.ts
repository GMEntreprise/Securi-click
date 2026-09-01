import { describe, expect, it } from '@jest/globals';
import { shouldResetQueryCache } from './sessionReset';

describe('session cache reset policy', () => {
  it('wipes the cache when another account signs in on the same device', () => {
    expect(shouldResetQueryCache('parent-1', 'parent-2')).toBe(true);
  });

  it('wipes the cache on logout', () => {
    expect(shouldResetQueryCache('parent-1', null)).toBe(true);
  });

  it('keeps the cache when the same account re-hydrates its session', () => {
    expect(shouldResetQueryCache('parent-1', 'parent-1')).toBe(false);
  });

  it('does not fight an idle app with no account on either side', () => {
    expect(shouldResetQueryCache(null, null)).toBe(false);
  });

  it('wipes the cache when a first account signs in after a restore', () => {
    expect(shouldResetQueryCache(null, 'parent-1')).toBe(true);
  });
});
