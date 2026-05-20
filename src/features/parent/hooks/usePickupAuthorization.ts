import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { subscribeToTable } from '@/lib/supabase/realtimeRegistry';
import {
  pickupAuthorizationService,
  type PickupAuthorization,
  type UpsertPickupAuthorizationPayload,
} from '../services/pickupAuthorization.service';

export const PICKUP_AUTH_KEY = (childId: string, guardianId: string) =>
  ['pickup_authorization', childId, guardianId] as const;

export const PICKUP_AUTH_CHILD_KEY = (childId: string) =>
  ['pickup_authorizations', 'child', childId] as const;

export function usePickupAuthorization(
  childId: string,
  guardianId: string,
  enableRealtime = false
) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: PICKUP_AUTH_KEY(childId, guardianId),
    queryFn: () =>
      pickupAuthorizationService.getForGuardian(childId, guardianId),
    enabled: !!(childId && guardianId),
    staleTime: 2 * 60 * 1000,
  });

  useEffect(() => {
    if (!enableRealtime || !childId || !guardianId) return;
    return subscribeToTable(
      `pickup-auth-${childId}`,
      { event: '*', schema: 'public', table: 'pickup_authorizations', filter: `child_id=eq.${childId}` },
      payload => {
        const row = (payload.new ?? payload.old) as PickupAuthorization;
        if (row?.guardian_id !== guardianId) return;
        if (payload.eventType === 'DELETE') {
          queryClient.setQueryData(PICKUP_AUTH_KEY(childId, guardianId), null);
        } else {
          queryClient.setQueryData(PICKUP_AUTH_KEY(childId, guardianId), payload.new as PickupAuthorization);
        }
        queryClient.invalidateQueries({ queryKey: PICKUP_AUTH_CHILD_KEY(childId) });
      }
    );
  }, [enableRealtime, childId, guardianId, queryClient]);

  return query;
}

export function useUpsertPickupAuthorization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpsertPickupAuthorizationPayload) =>
      pickupAuthorizationService.upsert(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: PICKUP_AUTH_KEY(variables.child_id, variables.guardian_id),
      });
      queryClient.invalidateQueries({
        queryKey: PICKUP_AUTH_CHILD_KEY(variables.child_id),
      });
    },
  });
}

export function useDeactivatePickupAuthorization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      childId,
      guardianId,
    }: {
      childId: string;
      guardianId: string;
    }) => pickupAuthorizationService.deactivate(childId, guardianId),
    onSuccess: (_data, { childId, guardianId }) => {
      queryClient.invalidateQueries({
        queryKey: PICKUP_AUTH_KEY(childId, guardianId),
      });
      queryClient.invalidateQueries({
        queryKey: PICKUP_AUTH_CHILD_KEY(childId),
      });
    },
  });
}
