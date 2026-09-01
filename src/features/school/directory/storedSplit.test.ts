import { describe, expect, it } from '@jest/globals';
import { resolveStoredSplit } from '../../../../supabase/functions/_shared/educationDirectory';

describe('official directory stored split', () => {
  it('counts a first national import as pure insertions', () => {
    expect(
      resolveStoredSplit({ initialCount: 0, finalCount: 48378, stored: 48378 })
    ).toEqual({ inserted: 48378, updated: 0 });
  });

  it('counts a re-run over an already complete catalogue as updates', () => {
    expect(
      resolveStoredSplit({
        initialCount: 48378,
        finalCount: 48378,
        stored: 48378,
      })
    ).toEqual({ inserted: 0, updated: 48378 });
  });

  it('splits a partial catalogue between new and refreshed records', () => {
    expect(
      resolveStoredSplit({
        initialCount: 829,
        finalCount: 48378,
        stored: 48378,
      })
    ).toEqual({ inserted: 47549, updated: 829 });
  });

  it('never reports negative counts when rows disappeared during the run', () => {
    expect(
      resolveStoredSplit({ initialCount: 500, finalCount: 400, stored: 400 })
    ).toEqual({ inserted: 0, updated: 400 });
  });

  it('reports nothing when the run stored nothing', () => {
    expect(
      resolveStoredSplit({ initialCount: 0, finalCount: 0, stored: 0 })
    ).toEqual({ inserted: 0, updated: 0 });
  });

  it('never reports more insertions than records actually stored', () => {
    expect(
      resolveStoredSplit({ initialCount: 0, finalCount: 900, stored: 300 })
    ).toEqual({ inserted: 300, updated: 0 });
  });
});
