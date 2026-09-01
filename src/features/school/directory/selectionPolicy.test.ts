import { describe, expect, it } from '@jest/globals';
import { canConfirmEstablishment } from './selectionPolicy';
import type { EducationEstablishment } from './types';

const establishment: EducationEstablishment = {
  id: '10000000-0000-0000-0000-000000000001',
  uai: '0750001A',
  official_name: 'Ecole Alpha',
  nature_label: 'ECOLE DE NIVEAU ELEMENTAIRE',
  sector: 'public',
  has_nursery: false,
  has_elementary: true,
  school_level: 'elementary',
  address_line_1: '1 rue Alpha',
  address_line_2: null,
  address_line_3: null,
  postal_code: '75001',
  city: 'Paris',
  department_name: 'Paris',
  academy: 'Paris',
  latitude: null,
  longitude: null,
  is_active: true,
  source_updated_at: null,
  is_claimed: false,
};

describe('official establishment selection policy', () => {
  it('allows only unclaimed active establishments during school signup', () => {
    expect(canConfirmEstablishment(establishment, 'claim')).toBe(true);
    expect(
      canConfirmEstablishment({ ...establishment, is_claimed: true }, 'claim')
    ).toBe(false);
  });

  it('allows only claimed active tenants when a parent links a child', () => {
    expect(canConfirmEstablishment(establishment, 'parent-link')).toBe(false);
    expect(
      canConfirmEstablishment(
        { ...establishment, is_claimed: true },
        'parent-link'
      )
    ).toBe(true);
    expect(
      canConfirmEstablishment(
        { ...establishment, is_active: false, is_claimed: true },
        'parent-link'
      )
    ).toBe(false);
  });
});
