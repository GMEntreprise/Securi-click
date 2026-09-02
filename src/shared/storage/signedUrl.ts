import { supabase } from '@/lib/supabase/client';
import { isStoragePath } from './storagePath';

const TTL_SECONDS = 3600;
const PUBLIC_BUCKETS = new Set([
  'profile-images',
  'collector-avatars',
  'avatars',
]);
const REFRESH_MARGIN_MS = 60_000;

interface CacheEntry {
  url: string;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

function cached(key: string): string | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.url;
}

function remember(key: string, url: string): void {
  cache.set(key, {
    url,
    expiresAt: Date.now() + TTL_SECONDS * 1000 - REFRESH_MARGIN_MS,
  });
}

export function clearSignedUrlCache(): void {
  cache.clear();
}

export async function resolveStorageUrl(
  bucket: string,
  reference: string | null | undefined
): Promise<string | null> {
  if (!reference) return null;
  if (!isStoragePath(reference)) return reference;
  if (PUBLIC_BUCKETS.has(bucket)) {
    return supabase.storage.from(bucket).getPublicUrl(reference).data.publicUrl;
  }

  const key = `${bucket}/${reference}`;
  const hit = cached(key);
  if (hit) return hit;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(reference, TTL_SECONDS);
  if (error || !data?.signedUrl) return null;

  remember(key, data.signedUrl);
  return data.signedUrl;
}

export async function resolveStorageUrls(
  bucket: string,
  references: readonly (string | null | undefined)[]
): Promise<Map<string, string>> {
  const resolved = new Map<string, string>();
  const pending: string[] = [];

  for (const reference of references) {
    if (!reference) continue;
    if (!isStoragePath(reference)) {
      resolved.set(reference, reference);
      continue;
    }
    if (PUBLIC_BUCKETS.has(bucket)) {
      resolved.set(
        reference,
        supabase.storage.from(bucket).getPublicUrl(reference).data.publicUrl
      );
      continue;
    }
    const hit = cached(`${bucket}/${reference}`);
    if (hit) resolved.set(reference, hit);
    else if (!pending.includes(reference)) pending.push(reference);
  }

  if (pending.length === 0) return resolved;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrls(pending, TTL_SECONDS);
  if (error || !data) return resolved;

  for (const item of data) {
    if (!item.path || !item.signedUrl) continue;
    remember(`${bucket}/${item.path}`, item.signedUrl);
    resolved.set(item.path, item.signedUrl);
  }
  return resolved;
}
