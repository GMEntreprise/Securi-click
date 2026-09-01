import { describe, expect, it } from '@jest/globals';
import { isSyncFailingFast } from '../../../../supabase/functions/_shared/educationDirectory';

describe('official directory sync health', () => {
  it('aborts a run where every upsert fails, instead of burning the whole catalogue', () => {
    expect(isSyncFailingFast({ fetched: 1055, stored: 0, errors: 1055 })).toBe(
      true
    );
  });

  it('keeps running while the sample is too small to conclude', () => {
    expect(isSyncFailingFast({ fetched: 100, stored: 0, errors: 100 })).toBe(
      false
    );
  });

  it('keeps running when records are actually landing', () => {
    expect(isSyncFailingFast({ fetched: 1000, stored: 995, errors: 5 })).toBe(
      false
    );
  });

  it('does not abort a clean run that stored everything', () => {
    expect(isSyncFailingFast({ fetched: 2000, stored: 2000, errors: 0 })).toBe(
      false
    );
    expect(isSyncFailingFast({ fetched: 0, stored: 0, errors: 0 })).toBe(false);
  });

  it('does not abort a run whose only rejects are out-of-scope skips', () => {
    expect(isSyncFailingFast({ fetched: 5000, stored: 0, errors: 0 })).toBe(
      false
    );
  });
});
