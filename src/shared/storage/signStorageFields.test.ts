import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockResolve =
  jest.fn<
    (
      bucket: string,
      refs: readonly (string | null | undefined)[]
    ) => Promise<Map<string, string>>
  >();
jest.mock('./signedUrl', () => ({
  resolveStorageUrls: (b: string, r: readonly (string | null | undefined)[]) =>
    mockResolve(b, r),
}));

import { signStorageFields } from './signStorageFields';

const signAll = (
  _bucket: string,
  refs: readonly (string | null | undefined)[]
) =>
  Promise.resolve(
    new Map(
      refs.filter((r): r is string => Boolean(r)).map(r => [r, `signed(${r})`])
    )
  );

describe('deep storage field signing', () => {
  beforeEach(() => {
    mockResolve.mockReset();
  });

  it('signs a field nested inside a related record', async () => {
    mockResolve.mockImplementation(signAll);
    const payload = [
      { id: '1', child: { first_name: 'Lucie', photo_url: 'uid/a.jpg' } },
    ];
    await expect(
      signStorageFields(payload, 'children-images', ['photo_url'])
    ).resolves.toEqual([
      {
        id: '1',
        child: { first_name: 'Lucie', photo_url: 'signed(uid/a.jpg)' },
      },
    ]);
  });

  it('asks storage once for the whole page, not once per row', async () => {
    mockResolve.mockImplementation(signAll);
    const rows = [
      { photo_url: 'uid/a.jpg' },
      { photo_url: 'uid/b.jpg' },
      { photo_url: 'uid/a.jpg' },
    ];
    await signStorageFields(rows, 'children-images', ['photo_url']);
    expect(mockResolve).toHaveBeenCalledTimes(1);
    expect(mockResolve.mock.calls[0][1]).toEqual([
      'uid/a.jpg',
      'uid/b.jpg',
      'uid/a.jpg',
    ]);
  });

  it('leaves a legacy absolute url untouched', async () => {
    mockResolve.mockImplementation(signAll);
    const url =
      'https://x.supabase.co/storage/v1/object/public/children-images/u/a.jpg';
    await expect(
      signStorageFields({ photo_url: url }, 'children-images', ['photo_url'])
    ).resolves.toEqual({ photo_url: url });
  });

  it('never calls storage when nothing needs signing', async () => {
    await expect(
      signStorageFields({ photo_url: null, name: 'x' }, 'children-images', [
        'photo_url',
      ])
    ).resolves.toEqual({ photo_url: null, name: 'x' });
    expect(mockResolve).not.toHaveBeenCalled();
  });

  it('keeps the row readable when a signature cannot be produced', async () => {
    mockResolve.mockImplementation(() => Promise.resolve(new Map()));
    await expect(
      signStorageFields({ photo_url: 'uid/a.jpg' }, 'children-images', [
        'photo_url',
      ])
    ).resolves.toEqual({ photo_url: null });
  });

  it('passes null and undefined payloads straight through', async () => {
    await expect(
      signStorageFields(null, 'children-images', ['photo_url'])
    ).resolves.toBeNull();
  });
});
