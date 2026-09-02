import { describe, expect, it } from '@jest/globals';
import { collectIdentityDocumentPaths } from './accountStorage';

describe('account storage purge targets', () => {
  it('collects every document slot of every identity record', () => {
    expect(
      collectIdentityDocumentPaths([
        {
          front_path: 'p1/c1/front-1.jpg',
          back_path: 'p1/c1/back-1.jpg',
          selfie_path: null,
        },
        {
          front_path: 'p2/c1/front-9.jpg',
          back_path: null,
          selfie_path: 'p2/c1/selfie-9.jpg',
        },
      ])
    ).toEqual([
      'p1/c1/front-1.jpg',
      'p1/c1/back-1.jpg',
      'p2/c1/front-9.jpg',
      'p2/c1/selfie-9.jpg',
    ]);
  });

  it('reaches documents filed under other families, which a prefix listing cannot', () => {
    const paths = collectIdentityDocumentPaths([
      {
        front_path: 'another-parent/me/front.jpg',
        back_path: null,
        selfie_path: null,
      },
    ]);
    expect(paths).toEqual(['another-parent/me/front.jpg']);
  });

  it('drops empty slots and duplicates instead of asking storage to delete them', () => {
    expect(
      collectIdentityDocumentPaths([
        { front_path: 'p/c/a.jpg', back_path: '', selfie_path: undefined },
        { front_path: 'p/c/a.jpg', back_path: null, selfie_path: null },
      ])
    ).toEqual(['p/c/a.jpg']);
  });

  it('returns nothing when the account never submitted a document', () => {
    expect(collectIdentityDocumentPaths([])).toEqual([]);
    expect(collectIdentityDocumentPaths(null)).toEqual([]);
  });
});
