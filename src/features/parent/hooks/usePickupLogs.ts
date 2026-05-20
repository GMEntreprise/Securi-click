import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useSession } from '@/features/auth/store/auth.store';
import { subscribeToTable } from '@/lib/supabase/realtimeRegistry';
import { parentService } from '../services/parent.service';
import type { PickupLog } from '../types';

export const PICKUP_LOGS_KEY = (parentId: string) =>
  ['parent', 'pickup-logs', parentId] as const;

export function usePickupLogs(limit = 50) {
  const session = useSession();
  const parentId = session?.user.id ?? '';
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: PICKUP_LOGS_KEY(parentId),
    queryFn: () => parentService.getPickupLogs(parentId, limit),
    enabled: !!parentId,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (!parentId) return;
    return subscribeToTable(
      `pickup-logs-${parentId}`,
      { event: 'INSERT', schema: 'public', table: 'pickup_logs' },
      () => { queryClient.invalidateQueries({ queryKey: PICKUP_LOGS_KEY(parentId) }); }
    );
  }, [parentId, queryClient]);

  return query;
}

export function useRecentPickupLogs(limit = 5) {
  const session = useSession();
  const parentId = session?.user.id ?? '';

  return useQuery({
    queryKey: [...PICKUP_LOGS_KEY(parentId), 'recent', limit],
    queryFn: () => parentService.getPickupLogs(parentId, limit),
    enabled: !!parentId,
    staleTime: 60 * 1000,
  });
}

export function usePickupStats() {
  const session = useSession();
  const parentId = session?.user.id ?? '';

  const { data: logs } = useQuery({
    queryKey: [...PICKUP_LOGS_KEY(parentId), 'stats'],
    queryFn: () => parentService.getPickupLogs(parentId, 100),
    enabled: !!parentId,
    staleTime: 60 * 1000,
    select: (logs: PickupLog[]) => ({
      completed: logs.filter(l => l.status === 'completed').length,
      denied: logs.filter(l => l.status === 'denied').length,
      cancelled: logs.filter(l => l.status === 'cancelled').length,
    }),
  });

  return logs ?? { completed: 0, denied: 0, cancelled: 0 };
}
