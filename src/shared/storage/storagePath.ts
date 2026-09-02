const PUBLIC_OBJECT_SEGMENT = '/storage/v1/object/public/';

export function isStoragePath(reference: string | null | undefined): boolean {
  if (!reference) return false;
  return !/^https?:\/\//i.test(reference);
}

export function publicUrlToPath(
  reference: string | null | undefined,
  bucket: string
): string | null {
  if (!reference || isStoragePath(reference)) return null;
  const marker = `${PUBLIC_OBJECT_SEGMENT}${bucket}/`;
  const index = reference.indexOf(marker);
  if (index === -1) return null;
  const path = reference.slice(index + marker.length).split('?')[0];
  return path.length > 0 ? path : null;
}
