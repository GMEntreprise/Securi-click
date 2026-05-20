import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
  InfiniteData,
} from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { useSession } from '@/features/auth/store/auth.store';
import { subscribeToTableMulti } from '@/lib/supabase/realtimeRegistry';
import { historyService } from '../services/history.service';
import type {
  HistoryEntry,
  HistoryFilters,
  HistoryPage,
} from '../services/history.service';

export type { HistoryEntry, HistoryFilters };

export interface SectionItem {
  type: 'header';
  key: string;
  label: string;
  count: number;
}
export interface RowItem {
  type: 'row';
  key: string;
  data: HistoryEntry;
}
export type FlatListItem = SectionItem | RowItem;

export const HISTORY_KEY = (parentId: string, filters: HistoryFilters) =>
  ['history', parentId, filters] as const;

export const MONTHLY_COUNTS_KEY = (parentId: string) =>
  ['history', 'monthly-counts', parentId] as const;

function groupByDate(entries: HistoryEntry[]): FlatListItem[] {
  const result: FlatListItem[] = [];
  let currentDay = '';

  for (const entry of entries) {
    const d = new Date(entry.scanned_at);
    const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (dayKey !== currentDay) {
      currentDay = dayKey;
      const label = d.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      result.push({ type: 'header', key: `header-${dayKey}`, label, count: 0 });
    }
    result.push({ type: 'row', key: entry.id, data: entry });
  }

  // patch header counts
  let headerIdx = -1;
  for (let i = 0; i < result.length; i++) {
    if (result[i].type === 'header') {
      headerIdx = i;
    } else if (headerIdx >= 0) {
      (result[headerIdx] as SectionItem).count += 1;
    }
  }

  return result;
}

export function useHistoryFeed(filters: HistoryFilters) {
  const session = useSession();
  const parentId = session?.user.id ?? '';
  const queryClient = useQueryClient();
  const query = useInfiniteQuery({
    queryKey: HISTORY_KEY(parentId, filters),
    queryFn: ({ pageParam }) =>
      historyService.fetchPage(parentId, filters, pageParam as string | null),
    initialPageParam: null as string | null,
    getNextPageParam: last => last.nextCursor ?? undefined,
    enabled: !!parentId,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (!parentId) return;

    return subscribeToTableMulti(`pickup-history-${parentId}`, [
      {
        config: { event: 'INSERT', schema: 'public', table: 'pickup_history', filter: `parent_id=eq.${parentId}` },
        callback: payload => {
          queryClient.setQueryData<InfiniteData<HistoryPage>>(
            HISTORY_KEY(parentId, filters),
            old => {
              if (!old) return old;
              const newEntry = payload.new as HistoryEntry;
              const alreadyExists = old.pages.some(p =>
                p.items.some(item => item.id === newEntry.id)
              );
              if (alreadyExists) return old;
              return {
                ...old,
                pages: old.pages.map((page, i) =>
                  i === 0
                    ? { ...page, items: [newEntry, ...page.items], total: page.total + 1 }
                    : page
                ),
              };
            }
          );
          queryClient.invalidateQueries({ queryKey: MONTHLY_COUNTS_KEY(parentId) });
        },
      },
      {
        config: { event: 'UPDATE', schema: 'public', table: 'pickup_history', filter: `parent_id=eq.${parentId}` },
        callback: payload => {
          const updated = payload.new as HistoryEntry;
          queryClient.setQueryData<InfiniteData<HistoryPage>>(
            HISTORY_KEY(parentId, filters),
            old => {
              if (!old) return old;
              return {
                ...old,
                pages: old.pages.map(page => ({
                  ...page,
                  items: page.items.map(item =>
                    item.id === updated.id ? updated : item
                  ),
                })),
              };
            }
          );
        },
      },
    ]);
  }, [parentId, filters, queryClient]);

  const flatItems = useMemo<FlatListItem[]>(() => {
    const allEntries = (query.data?.pages ?? []).flatMap(p => p.items);
    return groupByDate(allEntries);
  }, [query.data]);

  const total = query.data?.pages[0]?.total ?? 0;

  return { ...query, flatItems, total };
}

export function useHistoryDetail(entryId: string | null) {
  return useQuery({
    queryKey: ['history', 'detail', entryId],
    queryFn: () => historyService.fetchDetail(entryId!),
    enabled: !!entryId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMonthlyCounts() {
  const session = useSession();
  const parentId = session?.user.id ?? '';

  return useQuery({
    queryKey: MONTHLY_COUNTS_KEY(parentId),
    queryFn: () => historyService.fetchMonthlyCounts(parentId),
    enabled: !!parentId,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePinEntry() {
  const session = useSession();
  const parentId = session?.user.id ?? '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ entryId, pinned }: { entryId: string; pinned: boolean }) =>
      historyService.pinEntry(entryId, pinned),
    onSuccess: (_data, { entryId, pinned }) => {
      queryClient.setQueriesData<InfiniteData<HistoryPage>>(
        { queryKey: ['history', parentId] },
        old => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map(page => ({
              ...page,
              items: page.items.map(item =>
                item.id === entryId ? { ...item, is_pinned: pinned } : item
              ),
            })),
          };
        }
      );
      queryClient.invalidateQueries({
        queryKey: ['history', 'detail', entryId],
      });
    },
  });
}
