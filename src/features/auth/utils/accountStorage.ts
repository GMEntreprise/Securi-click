export interface IdentityDocumentRow {
  front_path?: string | null;
  back_path?: string | null;
  selfie_path?: string | null;
}

export const ACCOUNT_OWNED_BUCKETS = [
  'profile-images',
  'children-images',
  'collector-avatars',
  'school-logos',
] as const;

export function collectIdentityDocumentPaths(
  rows: readonly IdentityDocumentRow[] | null | undefined
): string[] {
  const paths: string[] = [];
  for (const row of rows ?? []) {
    for (const slot of [row.front_path, row.back_path, row.selfie_path]) {
      if (!slot) continue;
      if (paths.includes(slot)) continue;
      paths.push(slot);
    }
  }
  return paths;
}
