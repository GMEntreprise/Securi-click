export type EstablishmentSector = 'public' | 'private' | 'unknown';
export type EstablishmentLevel =
  | 'nursery'
  | 'elementary'
  | 'primary'
  | 'combined';

export interface EducationEstablishment {
  id: string;
  uai: string;
  official_name: string;
  nature_label: string;
  sector: EstablishmentSector;
  has_nursery: boolean;
  has_elementary: boolean;
  school_level: EstablishmentLevel;
  address_line_1: string | null;
  address_line_2: string | null;
  address_line_3: string | null;
  postal_code: string;
  city: string;
  department_name: string | null;
  academy: string | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  source_updated_at: string | null;
  is_claimed: boolean;
  rank_score?: number;
}

export type EstablishmentLookupResult =
  | { status: 'found'; establishment: EducationEstablishment }
  | { status: 'invalid_uai' }
  | { status: 'not_found' }
  | { status: 'network_error' };

export type EstablishmentClaimStatus =
  | 'claimed'
  | 'already_claimed'
  | 'inactive'
  | 'not_found'
  | 'invalid_uai'
  | 'unauthorized'
  | 'forbidden';

export interface EstablishmentClaimResult {
  status: EstablishmentClaimStatus;
  school_id?: string;
}

export interface EstablishmentSearchPage {
  data: EducationEstablishment[];
  page: number;
  hasMore: boolean;
}
