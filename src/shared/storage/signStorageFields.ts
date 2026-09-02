import { resolveStorageUrls } from './signedUrl';
import { isStoragePath } from './storagePath';

function collect(
  node: unknown,
  fields: readonly string[],
  found: string[]
): void {
  if (Array.isArray(node)) {
    for (const item of node) collect(item, fields, found);
    return;
  }
  if (!node || typeof node !== 'object') return;
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (
      fields.includes(key) &&
      typeof value === 'string' &&
      isStoragePath(value)
    ) {
      found.push(value);
      continue;
    }
    collect(value, fields, found);
  }
}

function rewrite(
  node: unknown,
  fields: readonly string[],
  urls: Map<string, string>
): unknown {
  if (Array.isArray(node)) {
    return node.map(item => rewrite(item, fields, urls));
  }
  if (!node || typeof node !== 'object') return node;
  const source = node as Record<string, unknown>;
  const target: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(source)) {
    if (
      fields.includes(key) &&
      typeof value === 'string' &&
      isStoragePath(value)
    ) {
      target[key] = urls.get(value) ?? null;
      continue;
    }
    target[key] = rewrite(value, fields, urls);
  }
  return target;
}

export async function signStorageFields<T>(
  payload: T,
  bucket: string,
  fields: readonly string[]
): Promise<T> {
  if (payload === null || payload === undefined) return payload;

  const references: string[] = [];
  collect(payload, fields, references);
  if (references.length === 0) return payload;

  const urls = await resolveStorageUrls(bucket, references);
  return rewrite(payload, fields, urls) as T;
}
