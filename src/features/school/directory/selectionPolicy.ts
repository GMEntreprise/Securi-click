import type { EducationEstablishment } from './types';

export type EstablishmentSelectionPurpose = 'claim' | 'parent-link';

export function canConfirmEstablishment(
  establishment: EducationEstablishment | null,
  purpose: EstablishmentSelectionPurpose
): boolean {
  if (!establishment?.is_active) return false;
  return purpose === 'claim'
    ? !establishment.is_claimed
    : establishment.is_claimed;
}
