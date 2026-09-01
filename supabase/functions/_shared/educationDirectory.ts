export const EDUCATION_DIRECTORY_SOURCE = 'education_annuaire';
export const EDUCATION_DIRECTORY_URL =
  'https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-annuaire-education/records';
export const PARIS_DEPARTMENT_CODE = '075';
export const FRANCE_DEPARTMENT_CODES = [
  '001',
  '002',
  '003',
  '004',
  '005',
  '006',
  '007',
  '008',
  '009',
  '010',
  '011',
  '012',
  '013',
  '014',
  '015',
  '016',
  '017',
  '018',
  '019',
  '021',
  '022',
  '023',
  '024',
  '025',
  '026',
  '027',
  '028',
  '029',
  '02A',
  '02B',
  '030',
  '031',
  '032',
  '033',
  '034',
  '035',
  '036',
  '037',
  '038',
  '039',
  '040',
  '041',
  '042',
  '043',
  '044',
  '045',
  '046',
  '047',
  '048',
  '049',
  '050',
  '051',
  '052',
  '053',
  '054',
  '055',
  '056',
  '057',
  '058',
  '059',
  '060',
  '061',
  '062',
  '063',
  '064',
  '065',
  '066',
  '067',
  '068',
  '069',
  '070',
  '071',
  '072',
  '073',
  '074',
  '075',
  '076',
  '077',
  '078',
  '079',
  '080',
  '081',
  '082',
  '083',
  '084',
  '085',
  '086',
  '087',
  '088',
  '089',
  '090',
  '091',
  '092',
  '093',
  '094',
  '095',
  '971',
  '972',
  '973',
  '974',
  '975',
  '976',
  '977',
  '978',
  '986',
  '987',
  '988',
] as const;
export const UAI_PATTERN = /^[0-9]{7}[A-Z]$/;

export type DirectoryScope = 'paris' | 'france';
export type SchoolLevel = 'nursery' | 'elementary' | 'primary' | 'combined';
export type EstablishmentSector = 'public' | 'private' | 'unknown';

export interface OfficialEducationRecord {
  identifiant_de_l_etablissement?: string;
  nom_etablissement?: string;
  patronyme_uai?: string;
  appellation_officielle?: string;
  type_etablissement?: string;
  statut_public_prive?: string;
  libelle_nature?: string;
  code_nature?: number;
  adresse_1?: string;
  adresse_2?: string;
  adresse_3?: string;
  nom_commune?: string;
  code_postal?: string;
  code_departement?: string;
  libelle_departement?: string;
  libelle_academie?: string;
  libelle_region?: string;
  ecole_maternelle?: number | string | boolean;
  ecole_elementaire?: number | string | boolean;
  telephone?: string;
  mail?: string;
  etat?: string;
  date_maj_ligne?: string;
  latitude?: number;
  longitude?: number;
}

export interface EducationEstablishmentUpsert {
  uai: string;
  official_name: string;
  patronym: string | null;
  denomination: string | null;
  nature_code: number | null;
  nature_label: string;
  sector: EstablishmentSector;
  has_nursery: boolean;
  has_elementary: boolean;
  school_level: SchoolLevel;
  address_line_1: string | null;
  address_line_2: string | null;
  address_line_3: string | null;
  postal_code: string;
  city: string;
  department_code: string;
  department_name: string | null;
  academy: string | null;
  academic_region: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  source: string;
  source_updated_at: string | null;
  synced_at: string;
  last_seen_run_id: string;
}

export interface NormalizeResult {
  value: EducationEstablishmentUpsert | null;
  reason?: string;
}

export interface StoredSplitInput {
  initialCount: number;
  finalCount: number;
  stored: number;
}

export function resolveStoredSplit(input: StoredSplitInput): {
  inserted: number;
  updated: number;
} {
  const growth = Math.max(input.finalCount - input.initialCount, 0);
  const inserted = Math.min(growth, input.stored);
  return { inserted, updated: input.stored - inserted };
}

export interface SyncHealth {
  fetched: number;
  stored: number;
  errors: number;
}

export const SYNC_HEALTH_MIN_SAMPLE = 200;

export function isSyncFailingFast(
  health: SyncHealth,
  minSample = SYNC_HEALTH_MIN_SAMPLE
): boolean {
  if (health.errors === 0) return false;
  if (health.fetched < minSample) return false;
  return health.stored === 0;
}

const SKIPPABLE_REASONS = new Set(['outside_school_type']);

export function isSkippableReason(reason: string | undefined): boolean {
  return reason !== undefined && SKIPPABLE_REASONS.has(reason);
}

export function normalizeUai(value: string): string {
  return value.trim().replace(/\s+/g, '').toUpperCase();
}

function officialFlag(value: number | string | boolean | undefined): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  return ['1', 'true', 'oui', 'yes'].includes(
    (value ?? '').trim().toLowerCase()
  );
}

function normalizeText(value: string | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function resolveLevel(
  hasNursery: boolean,
  hasElementary: boolean
): SchoolLevel {
  if (hasNursery && hasElementary) return 'combined';
  if (hasNursery) return 'nursery';
  if (hasElementary) return 'elementary';
  return 'primary';
}

function resolveSector(value: string | undefined): EstablishmentSector {
  const sector = (value ?? '').trim().toLowerCase();
  if (sector === 'public') return 'public';
  if (sector.startsWith('priv')) return 'private';
  return 'unknown';
}

export function isParisDepartment(departmentCode: string): boolean {
  return departmentCode === PARIS_DEPARTMENT_CODE || departmentCode === '75';
}

export function normalizeOfficialRecord(
  record: OfficialEducationRecord,
  runId: string,
  syncedAt = new Date().toISOString()
): NormalizeResult {
  const uai = normalizeUai(record.identifiant_de_l_etablissement ?? '');
  if (!UAI_PATTERN.test(uai)) return { value: null, reason: 'invalid_uai' };
  const officialName = normalizeText(record.nom_etablissement);
  if (!officialName) return { value: null, reason: 'missing_name' };
  if ((record.type_etablissement ?? '').trim().toLowerCase() !== 'ecole') {
    return { value: null, reason: 'outside_school_type' };
  }

  const hasNursery = officialFlag(record.ecole_maternelle);
  const hasElementary = officialFlag(record.ecole_elementaire);
  const level = resolveLevel(hasNursery, hasElementary);

  const postalCode = normalizeText(record.code_postal);
  const city = normalizeText(record.nom_commune);
  const departmentCode = normalizeText(record.code_departement);
  const natureLabel = normalizeText(record.libelle_nature);
  if (!postalCode || !city || !departmentCode || !natureLabel) {
    return { value: null, reason: 'missing_required_geography' };
  }

  return {
    value: {
      uai,
      official_name: officialName,
      patronym: normalizeText(record.patronyme_uai),
      denomination: normalizeText(record.appellation_officielle),
      nature_code:
        typeof record.code_nature === 'number' ? record.code_nature : null,
      nature_label: natureLabel,
      sector: resolveSector(record.statut_public_prive),
      has_nursery: hasNursery,
      has_elementary: hasElementary,
      school_level: level,
      address_line_1: normalizeText(record.adresse_1),
      address_line_2: normalizeText(record.adresse_2),
      address_line_3: normalizeText(record.adresse_3),
      postal_code: postalCode,
      city,
      department_code: departmentCode,
      department_name: normalizeText(record.libelle_departement),
      academy: normalizeText(record.libelle_academie),
      academic_region: normalizeText(record.libelle_region),
      latitude: typeof record.latitude === 'number' ? record.latitude : null,
      longitude: typeof record.longitude === 'number' ? record.longitude : null,
      phone: normalizeText(record.telephone),
      email: normalizeText(record.mail)?.toLowerCase() ?? null,
      is_active: (record.etat ?? '').trim().toUpperCase() === 'OUVERT',
      source: EDUCATION_DIRECTORY_SOURCE,
      source_updated_at: normalizeText(record.date_maj_ligne),
      synced_at: syncedAt,
      last_seen_run_id: runId,
    },
  };
}

export const EDUCATION_DIRECTORY_FIELDS = [
  'identifiant_de_l_etablissement',
  'nom_etablissement',
  'type_etablissement',
  'statut_public_prive',
  'libelle_nature',
  'code_nature',
  'adresse_1',
  'adresse_2',
  'adresse_3',
  'nom_commune',
  'code_postal',
  'code_departement',
  'libelle_departement',
  'libelle_academie',
  'libelle_region',
  'ecole_maternelle',
  'ecole_elementaire',
  'telephone',
  'mail',
  'etat',
  'date_maj_ligne',
  'latitude',
  'longitude',
].join(',');
