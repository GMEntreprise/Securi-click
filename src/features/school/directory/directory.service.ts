import { supabase } from '@/lib/supabase/client';
import { isValidUaiFormat, normalizeUai } from './normalizeUai';
import type {
  EducationEstablishment,
  EstablishmentClaimResult,
  EstablishmentLookupResult,
  EstablishmentSearchPage,
} from './types';

const PAGE_SIZE = 20;

function isEstablishment(value: unknown): value is EducationEstablishment {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === 'string' &&
    typeof row.uai === 'string' &&
    typeof row.official_name === 'string'
  );
}

function isClaimResult(value: unknown): value is EstablishmentClaimResult {
  if (!value || typeof value !== 'object') return false;
  const status = (value as Record<string, unknown>).status;
  return typeof status === 'string';
}

export const directoryService = {
  async search(query: string, page = 0): Promise<EstablishmentSearchPage> {
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 2) return { data: [], page, hasMore: false };
    const { data, error } = await supabase.rpc(
      'search_education_establishments',
      {
        p_query: normalizedQuery,
        p_page: page,
        p_page_size: PAGE_SIZE,
      }
    );
    if (error) throw new Error('directory_network_error');
    const rows = Array.isArray(data) ? data.filter(isEstablishment) : [];
    return { data: rows, page, hasMore: rows.length === PAGE_SIZE };
  },

  async byUai(input: string): Promise<EstablishmentLookupResult> {
    const uai = normalizeUai(input);
    if (!isValidUaiFormat(uai)) return { status: 'invalid_uai' };
    const { data, error } = await supabase.rpc(
      'get_education_establishment_by_uai',
      { p_uai: uai }
    );
    if (error) return { status: 'network_error' };
    const establishment = Array.isArray(data)
      ? data.find(isEstablishment)
      : undefined;
    return establishment
      ? { status: 'found', establishment }
      : { status: 'not_found' };
  },

  async claim(uai: string): Promise<EstablishmentClaimResult> {
    const { data, error } = await supabase.rpc(
      'claim_education_establishment',
      { p_uai: normalizeUai(uai) }
    );
    if (error || !isClaimResult(data)) throw new Error('directory_claim_error');
    return data;
  },

  async resolveSchoolId(establishmentId: string): Promise<string | null> {
    const { data, error } = await supabase.rpc('resolve_school_for_child', {
      p_establishment_id: establishmentId,
    });
    if (error) throw new Error('directory_network_error');
    if (!Array.isArray(data) || data.length === 0) return null;
    const row = data[0] as Record<string, unknown>;
    return typeof row.school_id === 'string' ? row.school_id : null;
  },
};
