import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  dehydrate,
  hydrate,
  type DehydratedState,
} from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { isDemoActive } from '@/features/demo/store/demo.store';
import { decryptText, deleteEncryptionKey, encryptText } from './encryption';

export const CACHE_STORAGE_KEY = 'securiclick_offline_cache_v1';

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_SIZE_BYTES = 2 * 1024 * 1024;
const SAVE_DELAY_MS = 2_000;

const PERSISTED_ROOTS = new Set([
  'parent',
  'qr-codes',
  'recent-scans',
  'history',
  'notifications',
  'guardian',
  'school',
  'collector',
  'collector-guardians',
  'collector-logs',
  'collector-profile',
  'collector-qr',
  'collector-scans',
]);

interface PersistedCache {
  userId: string;
  savedAt: number;
  state: DehydratedState;
}

let owner: string | null = null;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

export function setPersistenceOwner(userId: string | null): void {
  owner = userId;
}

export async function persistQueryCacheNow(): Promise<void> {
  if (!owner || isDemoActive()) return;

  const state = dehydrate(queryClient, {
    shouldDehydrateQuery: query =>
      query.state.status === 'success' &&
      PERSISTED_ROOTS.has(String(query.queryKey[0])),
    shouldDehydrateMutation: () => false,
  });
  const payload: PersistedCache = { userId: owner, savedAt: Date.now(), state };
  const serialized = JSON.stringify(payload);
  if (serialized.length > MAX_SIZE_BYTES) return;

  try {
    await AsyncStorage.setItem(
      CACHE_STORAGE_KEY,
      await encryptText(serialized)
    );
  } catch {
    /* empty */
  }
}

export async function restoreQueryCache(userId: string): Promise<void> {
  owner = userId;
  try {
    const sealed = await AsyncStorage.getItem(CACHE_STORAGE_KEY);
    if (!sealed) return;
    const cache = JSON.parse(await decryptText(sealed)) as PersistedCache;
    const isUsable =
      cache.userId === userId && Date.now() - cache.savedAt < MAX_AGE_MS;
    if (!isUsable) {
      await AsyncStorage.removeItem(CACHE_STORAGE_KEY);
      return;
    }
    hydrate(queryClient, cache.state);
  } catch {
    await AsyncStorage.removeItem(CACHE_STORAGE_KEY).catch(() => {});
  }
}

export async function clearPersistedQueryCache(): Promise<void> {
  owner = null;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = null;
  await Promise.allSettled([
    AsyncStorage.removeItem(CACHE_STORAGE_KEY),
    deleteEncryptionKey(),
  ]);
}

export function startQueryPersistence(): () => void {
  return queryClient.getQueryCache().subscribe(event => {
    if (event.type !== 'updated' || event.action.type !== 'success') return;
    if (saveTimer) return;
    saveTimer = setTimeout(() => {
      saveTimer = null;
      persistQueryCacheNow();
    }, SAVE_DELAY_MS);
  });
}
