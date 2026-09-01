import { isValidUaiFormat, normalizeUai } from '../directory/normalizeUai';

interface OfficialSchoolIdentity {
  education_establishment_id: string | null;
  external_id: string | null;
}

export function getOfficialSchoolUai(
  school: OfficialSchoolIdentity | null | undefined
): string | null {
  if (!school?.education_establishment_id || !school.external_id) return null;

  const uai = normalizeUai(school.external_id);
  return isValidUaiFormat(uai) ? uai : null;
}
