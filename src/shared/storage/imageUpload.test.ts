import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockUpload = jest.fn<(...args: unknown[]) => unknown>();
const mockFetch = jest.fn<(...args: unknown[]) => unknown>();
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    storage: {
      from: () => ({
        upload: (...args: unknown[]) => mockUpload(...args),
        createSignedUrl: async () => ({
          data: { signedUrl: 'https://signed.test/photo.jpg' },
          error: null,
        }),
      }),
    },
  },
}));

import { useDemoStore } from '@/features/demo/store/demo.store';
import { imageUploadService } from './imageUpload';

const LOCAL = 'file:///var/mobile/tmp/photo.jpg';

describe('imageUploadService', () => {
  beforeEach(() => {
    useDemoStore.getState().exit();
    mockUpload.mockReset();
    mockFetch.mockReset();
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  it('uploads to storage and returns a displayable url', async () => {
    mockFetch.mockImplementation(async () => ({
      arrayBuffer: async () => new ArrayBuffer(4),
    }));
    mockUpload.mockImplementation(async () => ({ error: null }));
    const result = await imageUploadService.upload(
      'children-images',
      'user-1',
      LOCAL
    );
    expect(mockUpload).toHaveBeenCalledTimes(1);
    expect(result.filePath).toMatch(/^user-1\/.+\.jpg$/);
    expect(result.signedUrl).toBe('https://signed.test/photo.jpg');
  });

  it('keeps the picture on the device during a demo', async () => {
    useDemoStore.getState().enter('parent');
    await expect(
      imageUploadService.upload('children-images', 'demo-parent', LOCAL)
    ).resolves.toEqual({ signedUrl: LOCAL, filePath: LOCAL });
    expect(mockUpload).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
