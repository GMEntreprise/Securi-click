import { supabase } from '@/lib/supabase/client';

export type HistoryStatus = 'completed' | 'denied' | 'cancelled';

export interface HistoryEntry {
  id: string;
  child_id: string;
  collector_id: string | null;
  parent_id: string;
  school_id: string | null;
  staff_id: string | null;
  qr_jti: string | null;
  status: HistoryStatus;
  scanned_at: string;
  created_at: string;
  validated_at: string | null;
  denial_reason: string | null;
  notes: Record<string, unknown>;
  is_pinned: boolean;
  is_archived: boolean;
  archived_at: string | null;
  child: {
    first_name: string;
    last_name: string;
    photo_url: string | null;
  } | null;
  guardian: {
    first_name: string;
    last_name: string;
    relationship: string;
    photo_url: string | null;
  } | null;
}

export interface HistoryDetail extends HistoryEntry {
  device_info: Record<string, unknown>;
  school: { name: string; address: string; city: string } | null;
  staff: { first_name: string; last_name: string } | null;
}

export interface HistoryFilters {
  status?: HistoryStatus | null;
  childId?: string | null;
  year?: number | null;
  month?: number | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  search?: string | null;
  showArchived?: boolean;
}

export interface HistoryPage {
  items: HistoryEntry[];
  nextCursor: string | null;
  total: number;
}

const HISTORY_SELECT = `
  id,
  child_id,
  collector_id,
  parent_id,
  school_id,
  staff_id,
  qr_jti,
  status,
  scanned_at,
  created_at,
  validated_at,
  denial_reason,
  notes,
  is_pinned,
  is_archived,
  archived_at,
  child:children(first_name, last_name, photo_url),
  guardian:guardians(first_name, last_name, relationship, photo_url)
`;

const HISTORY_DETAIL_SELECT = `
  id,
  child_id,
  collector_id,
  parent_id,
  school_id,
  staff_id,
  qr_jti,
  status,
  scanned_at,
  created_at,
  validated_at,
  denial_reason,
  notes,
  device_info,
  is_pinned,
  is_archived,
  archived_at,
  child:children(first_name, last_name, photo_url),
  guardian:guardians(first_name, last_name, relationship, photo_url),
  school:schools(name, address, city),
  staff:user_profiles!pickup_history_staff_id_fkey(first_name, last_name)
`;

export const historyService = {
  async fetchPage(
    parentId: string,
    filters: HistoryFilters,
    cursor: string | null,
    pageSize = 30
  ): Promise<HistoryPage> {
    let query = supabase
      .from('pickup_history')
      .select(HISTORY_SELECT, { count: 'exact' })
      .eq('parent_id', parentId)
      .order('scanned_at', { ascending: false })
      .limit(pageSize);

    if (!filters.showArchived) query = query.eq('is_archived', false);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.childId) query = query.eq('child_id', filters.childId);

    if (filters.year && filters.month) {
      const from = new Date(filters.year, filters.month - 1, 1).toISOString();
      const to = new Date(filters.year, filters.month, 1).toISOString();
      query = query.gte('scanned_at', from).lt('scanned_at', to);
    } else if (filters.year) {
      const from = new Date(filters.year, 0, 1).toISOString();
      const to = new Date(filters.year + 1, 0, 1).toISOString();
      query = query.gte('scanned_at', from).lt('scanned_at', to);
    } else if (filters.dateFrom) {
      query = query.gte('scanned_at', filters.dateFrom);
    }
    if (filters.dateTo) query = query.lte('scanned_at', filters.dateTo);

    if (cursor) query = query.lt('scanned_at', cursor);

    const { data, error, count } = await query;
    if (error) throw error;

    const items = (data ?? []) as unknown as HistoryEntry[];
    const lastItem = items[items.length - 1];

    return {
      items,
      nextCursor:
        items.length === pageSize && lastItem ? lastItem.scanned_at : null,
      total: count ?? 0,
    };
  },

  async fetchDetail(entryId: string): Promise<HistoryDetail> {
    const { data, error } = await supabase
      .from('pickup_history')
      .select(HISTORY_DETAIL_SELECT)
      .eq('id', entryId)
      .single();
    if (error) throw error;
    return data as unknown as HistoryDetail;
  },

  async fetchMonthlyCounts(
    parentId: string
  ): Promise<
    { year: number; month: number; count: number; archived_count: number }[]
  > {
    const { data, error } = await supabase
      .from('pickup_history_monthly_counts')
      .select('year, month, count, archived_count')
      .eq('parent_id', parentId)
      .order('year', { ascending: false })
      .order('month', { ascending: false });
    if (error) throw error;
    return (data ?? []) as {
      year: number;
      month: number;
      count: number;
      archived_count: number;
    }[];
  },

  async pinEntry(entryId: string, pinned: boolean): Promise<void> {
    const { error } = await supabase
      .from('pickup_history')
      .update({ is_pinned: pinned })
      .eq('id', entryId);
    if (error) throw error;
  },

  async archiveMonth(
    parentId: string,
    year: number,
    month: number
  ): Promise<number> {
    const { data, error } = await supabase.rpc('archive_history_month', {
      p_parent_id: parentId,
      p_year: year,
      p_month: month,
    });
    if (error) throw error;
    return (data as number) ?? 0;
  },

  async restoreMonth(
    parentId: string,
    year: number,
    month: number
  ): Promise<number> {
    const { data, error } = await supabase.rpc('restore_history_month', {
      p_parent_id: parentId,
      p_year: year,
      p_month: month,
    });
    if (error) throw error;
    return (data as number) ?? 0;
  },

  async searchEntries(
    parentId: string,
    search: string,
    limit = 20
  ): Promise<HistoryEntry[]> {
    const { data, error } = await supabase.rpc('search_pickup_history', {
      p_parent_id: parentId,
      p_search: search.trim(),
      p_limit: limit,
    });
    if (error) throw error;
    return (data ?? []) as unknown as HistoryEntry[];
  },
};
