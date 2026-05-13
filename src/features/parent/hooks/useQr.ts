import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useSession } from '@/features/auth/store/auth.store';
import { qrService } from '../services/qr.service';
import type { RecentScan } from '../services/qr.service';

const QR_KEY = (parentId: string, childId?: string) =>
  ['qr-codes', parentId, childId ?? 'all'] as const;

const SCANS_KEY = (parentId: string, childId?: string) =>
  ['recent-scans', parentId, childId ?? 'all'] as const;

export { type QrCode, type RecentScan } from '../services/qr.service';

export function useActiveQrCodes(childId?: string) {
  const session = useSession();
  const parentId = session?.user.id ?? '';
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const query = useQuery({
    queryKey: QR_KEY(parentId, childId),
    queryFn: () =>
      childId
        ? qrService.getQrCodesForChild(parentId, childId)
        : qrService.getActiveQrCodes(parentId),
    enabled: !!parentId,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (!parentId) return;
    channelRef.current?.unsubscribe();

    const ch = supabase
      .channel(`qr-codes-${parentId}-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'qr_codes',
          filter: `parent_id=eq.${parentId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: QR_KEY(parentId, childId),
          });
        }
      )
      .subscribe();

    channelRef.current = ch;
    return () => {
      ch.unsubscribe();
    };
  }, [parentId, childId, queryClient]);

  return query;
}

export function useRecentScans(childId?: string) {
  const session = useSession();
  const parentId = session?.user.id ?? '';
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const query = useQuery({
    queryKey: SCANS_KEY(parentId, childId),
    queryFn: () => qrService.getRecentScans(parentId, childId, 5),
    enabled: !!parentId,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (!parentId) return;
    channelRef.current?.unsubscribe();

    const ch = supabase
      .channel(
        `pickup-logs-qr-${parentId}-${Math.random().toString(36).slice(2)}`
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pickup_logs',
        },
        payload => {
          queryClient.setQueryData<RecentScan[]>(
            SCANS_KEY(parentId, childId),
            old => {
              if (!old) return old;
              const newScan = payload.new as RecentScan;
              return [newScan, ...old].slice(0, 5);
            }
          );
          queryClient.invalidateQueries({
            queryKey: SCANS_KEY(parentId, childId),
          });
        }
      )
      .subscribe();

    channelRef.current = ch;
    return () => {
      ch.unsubscribe();
    };
  }, [parentId, childId, queryClient]);

  return query;
}

export function useGenerateQrCode() {
  const session = useSession();
  const parentId = session?.user.id ?? '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      childId,
      guardianId,
    }: {
      childId: string;
      guardianId?: string | null;
    }) => qrService.generateQrCode(parentId, childId, guardianId ?? null),
    onSuccess: (_data, { childId }) => {
      queryClient.invalidateQueries({ queryKey: QR_KEY(parentId, childId) });
      queryClient.invalidateQueries({ queryKey: QR_KEY(parentId) });
    },
  });
}
