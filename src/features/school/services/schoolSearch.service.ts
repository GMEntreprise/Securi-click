import { supabase } from '@/lib/supabase/client';

export interface SchoolSearchResult {
  id: string;
  name: string;
  normalized_name: string;
  type: string;
  address: string;
  city: string;
  postal_code: string;
  logo_url: string | null;
  is_active: boolean;
  confidence: number;
}

export const schoolSearchService = {
  async search(query: string, city?: string): Promise<SchoolSearchResult[]> {
    if (query.trim().length < 2) return [];

    const { data, error } = await supabase.rpc('search_schools', {
      p_query: query.trim(),
      p_city: city?.trim() ?? null,
      p_limit: 10,
    });

    if (error) {
      if (__DEV__) console.warn('[schoolSearch] RPC error:', error.message);
      throw error;
    }

    const result = data as { success: boolean; data: SchoolSearchResult[] };
    if (!result.success) return [];

    if (__DEV__) {
      console.log('[schoolSearch] query:', query, '→', result.data?.length, 'résultats');
    }

    return result.data ?? [];
  },
};
