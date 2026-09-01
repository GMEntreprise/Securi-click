import type { UserRole } from '../types';

const KNOWN_ROLES: readonly UserRole[] = [
  'parent',
  'collector',
  'staff',
  'school_admin',
  'super_admin',
];

export type RoleResolution =
  | { status: 'resolved'; role: UserRole; shouldCache: boolean }
  | { status: 'unavailable' };

interface RoleResolutionInput {
  profileRole?: string | null;
  cachedRole?: string | null;
  profileFetchFailed: boolean;
}

function asKnownRole(value: string | null | undefined): UserRole | null {
  return KNOWN_ROLES.includes(value as UserRole) ? (value as UserRole) : null;
}

export function resolveSessionRole(input: RoleResolutionInput): RoleResolution {
  const fromProfile = asKnownRole(input.profileRole);
  if (fromProfile) {
    return { status: 'resolved', role: fromProfile, shouldCache: true };
  }
  if (!input.profileFetchFailed) return { status: 'unavailable' };

  const fromCache = asKnownRole(input.cachedRole);
  return fromCache
    ? { status: 'resolved', role: fromCache, shouldCache: false }
    : { status: 'unavailable' };
}
