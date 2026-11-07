import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('./encryption', () => ({
  encryptText: jest.fn(async (text: string) => `sealed:${text}`),
  decryptText: jest.fn(async (text: string) => {
    if (!text.startsWith('sealed:')) throw new Error('corrupt');
    return text.slice('sealed:'.length);
  }),
  deleteEncryptionKey: jest.fn(async () => undefined),
}));

import { queryClient } from '@/lib/queryClient';
import { useDemoStore } from '@/features/demo/store/demo.store';
import {
  CACHE_STORAGE_KEY,
  clearPersistedQueryCache,
  persistQueryCacheNow,
  restoreQueryCache,
  setPersistenceOwner,
} from './queryPersistence';
import { deleteEncryptionKey } from './encryption';

const stored = () => AsyncStorage.getItem(CACHE_STORAGE_KEY);

describe('offline query cache', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useDemoStore.getState().exit();
    queryClient.clear();
    setPersistenceOwner('user-1');
  });
  afterEach(() => {
    setPersistenceOwner(null);
    queryClient.clear();
  });

  it('brings the last known data back for the same user', async () => {
    queryClient.setQueryData(
      ['parent', 'children', 'user-1'],
      [{ id: 'child-1' }]
    );
    await persistQueryCacheNow();
    queryClient.clear();
    await restoreQueryCache('user-1');
    expect(queryClient.getQueryData(['parent', 'children', 'user-1'])).toEqual([
      { id: 'child-1' },
    ]);
  });

  it('never stores anything in clear text', async () => {
    queryClient.setQueryData(
      ['parent', 'children', 'user-1'],
      [{ id: 'child-1' }]
    );
    await persistQueryCacheNow();
    expect((await stored())?.startsWith('sealed:')).toBe(true);
  });

  it('never gives one account the data of another', async () => {
    queryClient.setQueryData(
      ['parent', 'children', 'user-1'],
      [{ id: 'child-1' }]
    );
    await persistQueryCacheNow();
    queryClient.clear();
    await restoreQueryCache('user-2');
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    expect(await stored()).toBeNull();
  });

  it('keeps identity documents off the disk', async () => {
    queryClient.setQueryData(['collector-identity', 'user-1'], {
      front_path: 'secret',
    });
    queryClient.setQueryData(['parent', 'children', 'user-1'], []);
    await persistQueryCacheNow();
    expect(await stored()).not.toContain('secret');
  });

  it('never writes demo data', async () => {
    useDemoStore.getState().enter('parent');
    queryClient.setQueryData(
      ['parent', 'children', 'demo-parent'],
      [{ id: 'demo-child-emma' }]
    );
    await persistQueryCacheNow();
    expect(await stored()).toBeNull();
  });

  it('keeps the real cache on disk while a demo runs', async () => {
    queryClient.setQueryData(
      ['parent', 'children', 'user-1'],
      [{ id: 'child-1' }]
    );
    await persistQueryCacheNow();
    useDemoStore.getState().enter('parent');
    await persistQueryCacheNow();
    useDemoStore.getState().exit();
    await restoreQueryCache('user-1');
    expect(queryClient.getQueryData(['parent', 'children', 'user-1'])).toEqual([
      { id: 'child-1' },
    ]);
  });

  it('survives a corrupted cache', async () => {
    await AsyncStorage.setItem(CACHE_STORAGE_KEY, 'not-encrypted');
    await expect(restoreQueryCache('user-1')).resolves.toBeUndefined();
    expect(await stored()).toBeNull();
  });

  it('ignores a cache older than a week', async () => {
    jest.useFakeTimers({
      doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'],
    });
    queryClient.setQueryData(
      ['parent', 'children', 'user-1'],
      [{ id: 'child-1' }]
    );
    await persistQueryCacheNow();
    queryClient.clear();
    jest.setSystemTime(Date.now() + 8 * 24 * 60 * 60 * 1000);
    await restoreQueryCache('user-1');
    jest.useRealTimers();
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });

  it('erases data and key at logout', async () => {
    queryClient.setQueryData(['parent', 'children', 'user-1'], []);
    await persistQueryCacheNow();
    await clearPersistedQueryCache();
    expect(await stored()).toBeNull();
    expect(deleteEncryptionKey).toHaveBeenCalled();
  });
});
