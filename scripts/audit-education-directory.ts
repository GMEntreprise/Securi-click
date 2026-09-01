import {
  EDUCATION_DIRECTORY_FIELDS,
  EDUCATION_DIRECTORY_URL,
  FRANCE_DEPARTMENT_CODES,
  PARIS_DEPARTMENT_CODE,
  type DirectoryScope,
  type OfficialEducationRecord,
  isSkippableReason,
  normalizeOfficialRecord,
  normalizeUai,
} from '../supabase/functions/_shared/educationDirectory.ts';

const PAGE_SIZE = 100;
const BASE_FILTER = 'type_etablissement:"Ecole" AND etat:"OUVERT"';

interface ApiPage {
  results: OfficialEducationRecord[];
  total_count: number;
}

function readScope(): DirectoryScope {
  return process.env.SYNC_SCOPE === 'france' ? 'france' : 'paris';
}

function recordsUrl(where: string, limit: number, offset: number): string {
  return `${EDUCATION_DIRECTORY_URL}?select=${encodeURIComponent(EDUCATION_DIRECTORY_FIELDS)}&where=${encodeURIComponent(where)}&order_by=identifiant_de_l_etablissement&limit=${limit}&offset=${offset}&timezone=Europe%2FParis`;
}

async function fetchPage(
  where: string,
  limit: number,
  offset: number
): Promise<ApiPage> {
  const response = await fetch(recordsUrl(where, limit, offset), {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`Education API HTTP ${response.status}`);
  return (await response.json()) as ApiPage;
}

async function countFor(where: string): Promise<number> {
  return (await fetchPage(where, 1, 0)).total_count;
}

async function fetchByUai(
  uai: string
): Promise<OfficialEducationRecord | null> {
  const page = await fetchPage(`identifiant_de_l_etablissement:"${uai}"`, 1, 0);
  return page.results[0] ?? null;
}

async function fetchDepartment(
  department: string
): Promise<OfficialEducationRecord[]> {
  const where = `${BASE_FILTER} AND code_departement:"${department}"`;
  const records: OfficialEducationRecord[] = [];
  let offset = 0;
  let total = Number.POSITIVE_INFINITY;
  while (offset < total) {
    const page = await fetchPage(where, PAGE_SIZE, offset);
    total = page.total_count;
    records.push(...page.results);
    offset += page.results.length;
    if (page.results.length === 0) break;
  }
  return records;
}

async function auditCoverage(departments: readonly string[]): Promise<{
  national_total: number;
  covered_total: number;
  uncovered_total: number;
  empty_departments: string[];
  per_department: Record<string, number>;
}> {
  const perDepartment: Record<string, number> = {};
  let covered = 0;
  for (const department of departments) {
    const count = await countFor(
      `${BASE_FILTER} AND code_departement:"${department}"`
    );
    perDepartment[department] = count;
    covered += count;
  }
  const nationalTotal = await countFor(BASE_FILTER);
  return {
    national_total: nationalTotal,
    covered_total: covered,
    uncovered_total: nationalTotal - covered,
    empty_departments: departments.filter(code => perDepartment[code] === 0),
    per_department: perDepartment,
  };
}

async function main(): Promise<void> {
  const scope = readScope();
  const departments =
    scope === 'paris' ? [PARIS_DEPARTMENT_CODE] : FRANCE_DEPARTMENT_CODES;
  const coverage =
    scope === 'france'
      ? await auditCoverage(departments)
      : {
          national_total: await countFor(
            `${BASE_FILTER} AND code_departement:"${PARIS_DEPARTMENT_CODE}"`
          ),
          covered_total: await countFor(
            `${BASE_FILTER} AND code_departement:"${PARIS_DEPARTMENT_CODE}"`
          ),
          uncovered_total: 0,
          empty_departments: [] as string[],
          per_department: {} as Record<string, number>,
        };

  const deep = scope === 'paris' || process.env.AUDIT_DEEP === '1';
  const records: OfficialEducationRecord[] = [];
  if (deep) {
    for (const department of departments) {
      records.push(...(await fetchDepartment(department)));
    }
  }

  const normalized = records.map(record =>
    normalizeOfficialRecord(record, 'dry-run')
  );
  const establishments = normalized.flatMap(result =>
    result.value ? [result.value] : []
  );
  const uaiCounts = new Map<string, number>();
  for (const establishment of establishments) {
    uaiCounts.set(
      establishment.uai,
      (uaiCounts.get(establishment.uai) ?? 0) + 1
    );
  }
  const duplicates = [...uaiCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([uai]) => uai);
  const dropped = normalized.filter(
    result => !result.value && !isSkippableReason(result.reason)
  );
  const droppedReasons: Record<string, number> = {};
  for (const result of dropped) {
    const reason = result.reason ?? 'invalid_record';
    droppedReasons[reason] = (droppedReasons[reason] ?? 0) + 1;
  }

  const requestedUai = normalizeUai(process.env.AUDIT_UAI ?? '');
  const requestedRecord = requestedUai ? await fetchByUai(requestedUai) : null;
  const requested = requestedRecord
    ? normalizeOfficialRecord(requestedRecord, 'dry-run').value
    : requestedUai
      ? null
      : undefined;

  const report = {
    scope,
    departments_scanned: departments.length,
    coverage,
    deep,
    fetched_records: records.length,
    in_scope_establishments: establishments.length,
    public_count: establishments.filter(item => item.sector === 'public')
      .length,
    private_count: establishments.filter(item => item.sector === 'private')
      .length,
    unknown_sector_count: establishments.filter(
      item => item.sector === 'unknown'
    ).length,
    nursery_count: establishments.filter(item => item.has_nursery).length,
    elementary_count: establishments.filter(item => item.has_elementary).length,
    combined_count: establishments.filter(
      item => item.school_level === 'combined'
    ).length,
    primary_fallback_count: establishments.filter(
      item => item.school_level === 'primary'
    ).length,
    skipped_count: normalized.filter(result => isSkippableReason(result.reason))
      .length,
    dropped_count: dropped.length,
    dropped_reasons: droppedReasons,
    duplicate_uais: duplicates,
    requested_uai: requestedUai || undefined,
    requested_result: requested,
  };
  console.log(JSON.stringify(report, null, 2));

  if (coverage.uncovered_total !== 0) process.exitCode = 1;
  if (coverage.empty_departments.length > 0) process.exitCode = 1;
  if (duplicates.length > 0) process.exitCode = 1;
  if (deep) {
    if (dropped.length > 0) process.exitCode = 1;
    if (establishments.length !== records.length) process.exitCode = 1;
  }
  if (requestedUai && !requested) process.exitCode = 1;
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
