#!/usr/bin/env -S npx ts-node --esm

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
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
  resolveStoredSplit,
} from '../supabase/functions/_shared/educationDirectory.ts';

const PAGE_SIZE = 100;
const MAX_RETRIES = 4;

interface ApiPage {
  results: OfficialEducationRecord[];
  total_count: number;
}
interface SyncMetrics {
  fetched: number;
  stored: number;
  skipped: number;
  errors: number;
  missing: number;
}
interface Checkpoint {
  departmentIndex: number;
  offset: number;
}

function readScope(): DirectoryScope {
  return process.env.SYNC_SCOPE === 'france' ? 'france' : 'paris';
}

async function fetchWithRetry(url: string): Promise<ApiPage> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok)
        throw new Error(`Education API HTTP ${response.status}`);
      return (await response.json()) as ApiPage;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < MAX_RETRIES - 1)
        await new Promise(resolve => setTimeout(resolve, 500 * 2 ** attempt));
    }
  }
  throw lastError ?? new Error('Education API unavailable');
}

function pageUrl(department: string, offset: number): string {
  const where = encodeURIComponent(
    `type_etablissement:"Ecole" AND etat:"OUVERT" AND code_departement:"${department}"`
  );
  return `${EDUCATION_DIRECTORY_URL}?select=${encodeURIComponent(EDUCATION_DIRECTORY_FIELDS)}&where=${where}&order_by=identifiant_de_l_etablissement&limit=${PAGE_SIZE}&offset=${offset}&timezone=Europe%2FParis`;
}

async function logRecordError(
  supabase: SupabaseClient,
  runId: string,
  record: OfficialEducationRecord,
  message: string
): Promise<void> {
  await supabase.from('education_sync_errors').insert({
    run_id: runId,
    uai: record.identifiant_de_l_etablissement ?? null,
    message,
    payload: record,
  });
}

async function syncRecords(
  supabase: SupabaseClient,
  runId: string,
  records: OfficialEducationRecord[],
  metrics: SyncMetrics
): Promise<void> {
  const normalized = records.map(record => ({
    record,
    result: normalizeOfficialRecord(record, runId),
  }));
  const valid = normalized.flatMap(item =>
    item.result.value ? [item.result.value] : []
  );
  for (const item of normalized) {
    if (item.result.value) continue;
    if (isSkippableReason(item.result.reason)) {
      metrics.skipped += 1;
      continue;
    }
    metrics.errors += 1;
    await logRecordError(
      supabase,
      runId,
      item.record,
      item.result.reason ?? 'invalid_record'
    );
  }
  if (valid.length === 0) return;
  const { error } = await supabase
    .from('education_establishments')
    .upsert(valid, { onConflict: 'uai' });
  if (error) {
    for (const item of normalized) {
      if (!item.result.value) continue;
      metrics.errors += 1;
      await logRecordError(supabase, runId, item.record, error.message);
    }
    return;
  }
  metrics.stored += valid.length;
}

async function countEstablishments(supabase: SupabaseClient): Promise<number> {
  const { count, error } = await supabase
    .from('education_establishments')
    .select('id', { count: 'exact', head: true });
  if (error) throw error;
  return count ?? 0;
}

async function reconcileClosures(
  supabase: SupabaseClient,
  runId: string,
  scope: DirectoryScope
): Promise<number> {
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
  return count ?? 0;
}

async function main(): Promise<void> {
  const url =
    process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.EXPO_SUPABASE_SERVICE_ROLE_KEY ??
    '';
  if (!url || !serviceKey)
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  const scope = readScope();
  const departments =
    scope === 'paris' ? [PARIS_DEPARTMENT_CODE] : FRANCE_DEPARTMENT_CODES;
  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
  const startedAt = Date.now();
  const metrics: SyncMetrics = {
    fetched: 0,
    stored: 0,
    skipped: 0,
    errors: 0,
    missing: 0,
  };
  const requestedRunId = process.env.SYNC_RUN_ID?.trim();
  let runId = requestedRunId ?? '';
  let checkpoint: Checkpoint = { departmentIndex: 0, offset: 0 };
  let resumedInserted = 0;
  let resumedUpdated = 0;

  if (runId) {
    const { data, error } = await supabase
      .from('education_sync_runs')
      .select(
        'id, scope, status, checkpoint, fetched_count, inserted_count, updated_count, skipped_count, error_count'
      )
      .eq('id', runId)
      .single();
    if (error || data.scope !== scope || data.status !== 'running')
      throw new Error('Invalid resumable sync run');
    const saved = data.checkpoint as Partial<Checkpoint> | null;
    checkpoint = {
      departmentIndex: saved?.departmentIndex ?? 0,
      offset: saved?.offset ?? 0,
    };
    metrics.fetched = data.fetched_count;
    metrics.skipped = data.skipped_count;
    metrics.errors = data.error_count;
    resumedInserted = data.inserted_count;
    resumedUpdated = data.updated_count;
  } else {
    const { data, error } = await supabase
      .from('education_sync_runs')
      .insert({ scope, status: 'running', source: EDUCATION_DIRECTORY_SOURCE })
      .select('id')
      .single();
    if (error) throw error;
    runId = String(data.id);
  }

  const initialCount = await countEstablishments(supabase);

  try {
    for (
      let departmentIndex = checkpoint.departmentIndex;
      departmentIndex < departments.length;
      departmentIndex += 1
    ) {
      const department = departments[departmentIndex];
      let offset =
        departmentIndex === checkpoint.departmentIndex ? checkpoint.offset : 0;
      let total = Number.POSITIVE_INFINITY;
      while (offset < total) {
        const page = await fetchWithRetry(pageUrl(department, offset));
        total = page.total_count;
        metrics.fetched += page.results.length;
        await syncRecords(supabase, runId, page.results, metrics);
        offset += page.results.length;
        const nextCheckpoint: Checkpoint =
          page.results.length < PAGE_SIZE
            ? { departmentIndex: departmentIndex + 1, offset: 0 }
            : { departmentIndex, offset };
        const { error } = await supabase
          .from('education_sync_runs')
          .update({
            checkpoint: nextCheckpoint,
            fetched_count: metrics.fetched,
            skipped_count: metrics.skipped,
            error_count: metrics.errors,
          })
          .eq('id', runId);
        if (error) throw error;
        if (isSyncFailingFast(metrics))
          throw new Error(
            `Sync aborted after ${metrics.fetched} fetched records: ${metrics.errors} rejected and none stored`
          );
        if (page.results.length < PAGE_SIZE) break;
      }
    }
    if (metrics.errors === 0)
      metrics.missing = await reconcileClosures(supabase, runId, scope);
    const split = resolveStoredSplit({
      initialCount,
      finalCount: await countEstablishments(supabase),
      stored: metrics.stored,
    });
    const inserted = resumedInserted + split.inserted;
    const updated = resumedUpdated + split.updated;
    const status = metrics.errors === 0 ? 'completed' : 'partial';
    const { error } = await supabase
      .from('education_sync_runs')
      .update({
        status,
        inserted_count: inserted,
        updated_count: updated,
        missing_count: metrics.missing,
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startedAt,
      })
      .eq('id', runId);
    if (error) throw error;
    console.log(
      JSON.stringify({
        run_id: runId,
        scope,
        status,
        ...metrics,
        inserted,
        updated,
        duration_ms: Date.now() - startedAt,
      })
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await supabase
      .from('education_sync_runs')
      .update({
        status: 'failed',
        error_summary: message,
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startedAt,
      })
      .eq('id', runId);
    throw error;
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
