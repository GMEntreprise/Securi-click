import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useSession } from '@/features/auth/store/auth.store';
import { schoolService } from '../services/school.service';
import { subscribeToTable } from '@/lib/supabase/realtimeRegistry';
import type { PickupValidation } from '../types';

export const VALIDATIONS_KEY = (schoolId: string) =>
  ['school', 'validations', schoolId] as const;
export const DASHBOARD_KEY = (schoolId: string) =>
  ['school', 'dashboard', schoolId] as const;
export const TODAY_VALIDATIONS_KEY = (schoolId: string) =>
  ['school', 'validations', 'today', schoolId] as const;

export function usePickupValidations(schoolId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: VALIDATIONS_KEY(schoolId),
    queryFn: () => schoolService.getPickupValidations(schoolId),
    enabled: !!schoolId,
    staleTime: 15 * 1000,
  });

  useEffect(() => {
    if (!schoolId) return;

    return subscribeToTable(
      `school-validations-${schoolId}`,
      { event: 'INSERT', schema: 'public', table: 'pickup_validations', filter: `school_id=eq.${schoolId}` },
      payload => {
        queryClient.setQueryData<PickupValidation[]>(
          VALIDATIONS_KEY(schoolId),
          old => {
            if (!old) return old;
            return [payload.new as PickupValidation, ...old].slice(0, 30);
          }
        );
        queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY(schoolId) });
        queryClient.invalidateQueries({ queryKey: TODAY_VALIDATIONS_KEY(schoolId) });
      }
    );
  }, [schoolId, queryClient]);

  return query;
}

export function useDashboardStats(schoolId: string) {
  return useQuery({
    queryKey: DASHBOARD_KEY(schoolId),
    queryFn: () => schoolService.getDashboardStats(schoolId),
    enabled: !!schoolId,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

export function useValidateQr(schoolId: string) {
  const queryClient = useQueryClient();
  const session = useSession();
  const scannerUserId = session?.user.id ?? '';

  return useMutation({
    mutationFn: (qrToken: string) =>
      schoolService.validateQr(qrToken, schoolId, scannerUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VALIDATIONS_KEY(schoolId) });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY(schoolId) });
      queryClient.invalidateQueries({
        queryKey: TODAY_VALIDATIONS_KEY(schoolId),
      });
    },
  });
}
