import { describe, expect, it } from '@jest/globals';
import { isStoragePath, publicUrlToPath } from './storagePath';

describe('storage reference discrimination', () => {
  it('recognises a stored path', () => {
    expect(isStoragePath('a1b2c3/photo-42.jpg')).toBe(true);
    expect(isStoragePath('parent-uuid/child-uuid/front-1.png')).toBe(true);
  });

  it('recognises a legacy absolute url so old rows keep rendering', () => {
    expect(
      isStoragePath(
        'https://xyz.supabase.co/storage/v1/object/public/children-images/uid/p.jpg'
      )
    ).toBe(false);
    expect(isStoragePath('http://example.test/x.png')).toBe(false);
  });

  it('treats an empty or missing reference as neither', () => {
    expect(isStoragePath('')).toBe(false);
    expect(isStoragePath(null)).toBe(false);
    expect(isStoragePath(undefined)).toBe(false);
  });

  it('extracts the object path from a legacy public url', () => {
    expect(
      publicUrlToPath(
        'https://xyz.supabase.co/storage/v1/object/public/children-images/uid-1/photo.jpg',
        'children-images'
      )
    ).toBe('uid-1/photo.jpg');
  });

  it('leaves a url from another bucket alone', () => {
    expect(
      publicUrlToPath(
        'https://xyz.supabase.co/storage/v1/object/public/profile-images/uid-1/a.jpg',
        'children-images'
      )
    ).toBeNull();
  });

  it('returns null when the value is not a public url at all', () => {
    expect(publicUrlToPath('uid-1/photo.jpg', 'children-images')).toBeNull();
    expect(publicUrlToPath(null, 'children-images')).toBeNull();
  });
});
