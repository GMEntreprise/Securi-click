import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/features/auth/store/auth.store';
import { subscribeToTable } from '@/lib/supabase/realtimeRegistry';
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
    return subscribeToTable(
      `qr-codes-${parentId}${childId ? `-${childId}` : ''}`,
      {
        event: '*',
        schema: 'public',
        table: 'qr_codes',
        filter: `parent_id=eq.${parentId}`,
      },
      () => {
        queryClient.invalidateQueries({ queryKey: QR_KEY(parentId, childId) });
      }
    );
  }, [parentId, childId, queryClient]);

  return query;
}

export function useRecentScans(childId?: string) {
  const session = useSession();
  const parentId = session?.user.id ?? '';
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: SCANS_KEY(parentId, childId),
    queryFn: () => qrService.getRecentScans(parentId, childId, 5),
    enabled: !!parentId,
    staleTime: 30 * 1000,
  });

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
