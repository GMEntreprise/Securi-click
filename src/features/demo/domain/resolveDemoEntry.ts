import type { DemoRole } from './types';

export interface DemoEntry {
  role: DemoRole;
  href: string;
}

export const DEMO_ROLE_HOMES: Record<DemoRole, string> = {
  parent: '/(parent-tabs)',
  collector: '/(collector-tabs)/home',
  establishment: '/(school-tabs)/home',
};

const ENTRIES: Record<string, DemoEntry> = {
  etablissement: { role: 'establishment', href: DEMO_ROLE_HOMES.establishment },
  collecteur: { role: 'collector', href: DEMO_ROLE_HOMES.collector },
  parent: { role: 'parent', href: DEMO_ROLE_HOMES.parent },
  'parent/collecteurs': { role: 'parent', href: '/(parent-tabs)/children' },
};

export function resolveDemoEntry(path: readonly string[]): DemoEntry | null {
  const key = path.join('/');
  return Object.prototype.hasOwnProperty.call(ENTRIES, key)
    ? ENTRIES[key]
    : null;
}
