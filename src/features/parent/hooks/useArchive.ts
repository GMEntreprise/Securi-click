import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/features/auth/store/auth.store';
import { historyService } from '../services/history.service';
import { HISTORY_KEY, MONTHLY_COUNTS_KEY } from './useHistory';
import type { HistoryFilters } from '../services/history.service';

export function useArchiveMonth(filters: HistoryFilters) {
  const session = useSession();
  const parentId = session?.user.id ?? '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ year, month }: { year: number; month: number }) =>
      historyService.archiveMonth(parentId, year, month),
    onSuccess: (_count, { year, month }) => {
      queryClient.invalidateQueries({
        queryKey: HISTORY_KEY(parentId, filters),
      });
      queryClient.invalidateQueries({ queryKey: MONTHLY_COUNTS_KEY(parentId) });
      queryClient.invalidateQueries({
        queryKey: HISTORY_KEY(parentId, { ...filters, year, month }),
      });
    },
  });
}

export function useRestoreMonth(filters: HistoryFilters) {
  const session = useSession();
  const parentId = session?.user.id ?? '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ year, month }: { year: number; month: number }) =>
      historyService.restoreMonth(parentId, year, month),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: HISTORY_KEY(parentId, filters),
      });
      queryClient.invalidateQueries({ queryKey: MONTHLY_COUNTS_KEY(parentId) });
    },
  });
}
