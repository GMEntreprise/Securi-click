import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  EDUCATION_DIRECTORY_FIELDS,
  EDUCATION_DIRECTORY_SOURCE,
  EDUCATION_DIRECTORY_URL,
  FRANCE_DEPARTMENT_CODES,
  PARIS_DEPARTMENT_CODE,
  type DirectoryScope,
  type OfficialEducationRecord,
  isSkippableReason,
  isSyncFailingFast,
  normalizeOfficialRecord,
} from '../_shared/educationDirectory.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};
const PAGE_SIZE = 100;

interface ApiPage {
  results: OfficialEducationRecord[];
  total_count: number;
}
interface Checkpoint {
  departmentIndex: number;
  offset: number;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

async function fetchPage(department: string, offset: number): Promise<ApiPage> {
  const where = encodeURIComponent(
    `type_etablissement:"Ecole" AND etat:"OUVERT" AND code_departement:"${department}"`
  );
  const url = `${EDUCATION_DIRECTORY_URL}?select=${encodeURIComponent(EDUCATION_DIRECTORY_FIELDS)}&where=${where}&order_by=identifiant_de_l_etablissement&limit=${PAGE_SIZE}&offset=${offset}&timezone=Europe%2FParis`;
  let lastError = 'Education API unavailable';
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok)
        throw new Error(`Education API HTTP ${response.status}`);
      return (await response.json()) as ApiPage;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      if (attempt < 3)
        await new Promise(resolve => setTimeout(resolve, 500 * 2 ** attempt));
    }
  }
  throw new Error(lastError);
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS')
    return new Response('ok', { headers: CORS });
  if (request.method !== 'POST')
    return json({ success: false, error: 'Method not allowed' }, 405);

  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const authorization = request.headers.get('Authorization') ?? '';
  if (!serviceKey || authorization !== `Bearer ${serviceKey}`)
    return json({ success: false, error: 'Unauthorized' }, 401);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    serviceKey,
    { auth: { persistSession: false } }
  );
  const requestUrl = new URL(request.url);
  const scope: DirectoryScope =
    requestUrl.searchParams.get('scope') === 'france' ? 'france' : 'paris';
  const maxPages = Math.min(
    Math.max(Number(requestUrl.searchParams.get('max_pages') ?? 10), 1),
    50
  );
  const requestedRunId = requestUrl.searchParams.get('run_id');
  const departments =
    scope === 'paris' ? [PARIS_DEPARTMENT_CODE] : FRANCE_DEPARTMENT_CODES;
  const startedAt = Date.now();
  let runId = requestedRunId ?? '';
  let checkpoint: Checkpoint = { departmentIndex: 0, offset: 0 };
  let fetched = 0;
  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  try {
    if (runId) {
      const { data, error } = await supabase
        .from('education_sync_runs')
        .select(
          'id, scope, status, checkpoint, fetched_count, inserted_count, updated_count, skipped_count, error_count'
        )
        .eq('id', runId)
        .single();
      if (error || data.scope !== scope || data.status !== 'running')
        return json({ success: false, error: 'Invalid run' }, 409);
      const saved = data.checkpoint as Partial<Checkpoint> | null;
      checkpoint = {
        departmentIndex: saved?.departmentIndex ?? 0,
        offset: saved?.offset ?? 0,
      };
      fetched = data.fetched_count;
      inserted = data.inserted_count;
      updated = data.updated_count;
      skipped = data.skipped_count;
      errors = data.error_count;
    } else {
      const { data, error } = await supabase
        .from('education_sync_runs')
        .insert({
          scope,
          status: 'running',
          source: EDUCATION_DIRECTORY_SOURCE,
        })
        .select('id')
        .single();
      if (error) throw error;
      runId = String(data.id);
    }

    let pagesProcessed = 0;
    while (
      checkpoint.departmentIndex < departments.length &&
      pagesProcessed < maxPages
    ) {
      const department = departments[checkpoint.departmentIndex];
      const page = await fetchPage(department, checkpoint.offset);
      fetched += page.results.length;
      const normalized = page.results.map(record => ({
        record,
        result: normalizeOfficialRecord(record, runId),
      }));
      const valid = normalized.flatMap(item =>
        item.result.value ? [item.result.value] : []
      );

      for (const item of normalized) {
        if (item.result.value) continue;
        if (isSkippableReason(item.result.reason)) {
          skipped += 1;
          continue;
        }
        errors += 1;
        await supabase.from('education_sync_errors').insert({
          run_id: runId,
          uai: item.record.identifiant_de_l_etablissement ?? null,
          message: item.result.reason ?? 'invalid_record',
          payload: item.record,
        });
      }

      if (valid.length > 0) {
        const { data: existing, error: readError } = await supabase
          .from('education_establishments')
          .select('uai')
          .in(
            'uai',
            valid.map(item => item.uai)
          );
        if (readError) throw readError;
        const existingUais = new Set(
          (existing ?? []).map(item => String(item.uai))
        );
        const { error: upsertError } = await supabase
          .from('education_establishments')
          .upsert(valid, { onConflict: 'uai' });
        if (upsertError) {
          errors += valid.length;
          await supabase.from('education_sync_errors').insert(
            valid.map(item => ({
              run_id: runId,
              uai: item.uai,
              message: upsertError.message,
            }))
          );
        } else {
          for (const item of valid) {
            if (existingUais.has(item.uai)) updated += 1;
            else inserted += 1;
          }
        }
      }

      checkpoint.offset += page.results.length;
      if (
        page.results.length < PAGE_SIZE ||
        checkpoint.offset >= page.total_count
      ) {
        checkpoint = {
          departmentIndex: checkpoint.departmentIndex + 1,
          offset: 0,
        };
      }
      pagesProcessed += 1;
      const { error: checkpointError } = await supabase
        .from('education_sync_runs')
        .update({
          checkpoint,
          fetched_count: fetched,
          inserted_count: inserted,
          updated_count: updated,
          skipped_count: skipped,
          error_count: errors,
        })
        .eq('id', runId);
      if (checkpointError) throw checkpointError;
      if (isSyncFailingFast({ fetched, stored: inserted + updated, errors }))
        throw new Error(
          `Sync aborted after ${fetched} fetched records: ${errors} rejected and none stored`
        );
    }

    const complete = checkpoint.departmentIndex >= departments.length;
    let missing = 0;
    if (complete && errors === 0) {
      let countQuery = supabase
        .from('education_establishments')
        .select('id', { count: 'exact', head: true })
        .eq('source', EDUCATION_DIRECTORY_SOURCE)
        .eq('is_active', true)
        .or(`last_seen_run_id.is.null,last_seen_run_id.neq.${runId}`);
      if (scope === 'paris')
        countQuery = countQuery.in('department_code', [
          PARIS_DEPARTMENT_CODE,
          '75',
        ]);
      const { count, error } = await countQuery;
      if (error) throw error;
      missing = count ?? 0;
      let updateQuery = supabase
        .from('education_establishments')
        .update({ is_active: false, synced_at: new Date().toISOString() })
        .eq('source', EDUCATION_DIRECTORY_SOURCE)
        .eq('is_active', true)
        .or(`last_seen_run_id.is.null,last_seen_run_id.neq.${runId}`);
      if (scope === 'paris')
        updateQuery = updateQuery.in('department_code', [
          PARIS_DEPARTMENT_CODE,
          '75',
        ]);
      const { error: updateError } = await updateQuery;
      if (updateError) throw updateError;
    }

    if (complete) {
      const status = errors === 0 ? 'completed' : 'partial';
      const { error } = await supabase
        .from('education_sync_runs')
        .update({
          status,
          missing_count: missing,
          completed_at: new Date().toISOString(),
          duration_ms: Date.now() - startedAt,
        })
        .eq('id', runId);
      if (error) throw error;
    }

    return json({
      success: true,
      run_id: runId,
      scope,
      status: complete ? (errors === 0 ? 'completed' : 'partial') : 'running',
      checkpoint,
      fetched,
      inserted,
      updated,
      skipped,
      errors,
      missing,
      duration_ms: Date.now() - startedAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (runId)
      await supabase
        .from('education_sync_runs')
        .update({ status: 'failed', error_summary: message })
        .eq('id', runId);
    return json({ success: false, run_id: runId || null, error: message }, 500);
  }
});
