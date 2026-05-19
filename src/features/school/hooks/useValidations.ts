import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useSession } from '@/features/auth/store/auth.store';
import { schoolService } from '../services/school.service';
import type { PickupValidation } from '../types';

export const VALIDATIONS_KEY = (schoolId: string) =>
  ['school', 'validations', schoolId] as const;
export const DASHBOARD_KEY = (schoolId: string) =>
  ['school', 'dashboard', schoolId] as const;
export const TODAY_VALIDATIONS_KEY = (schoolId: string) =>
  ['school', 'validations', 'today', schoolId] as const;

export function usePickupValidations(schoolId: string) {
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const query = useQuery({
    queryKey: VALIDATIONS_KEY(schoolId),
    queryFn: () => schoolService.getPickupValidations(schoolId),
    enabled: !!schoolId,
    staleTime: 15 * 1000,
  });

  useEffect(() => {
    if (!schoolId) return;
    if (channelRef.current) supabase.removeChannel(channelRef.current);

    const ch = supabase
      .channel(`school-validations-${schoolId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pickup_validations',
          filter: `school_id=eq.${schoolId}`,
        },
        payload => {
          queryClient.setQueryData<PickupValidation[]>(
            VALIDATIONS_KEY(schoolId),
            old => {
              if (!old) return old;
              return [payload.new as PickupValidation, ...old].slice(0, 30);
            }
          );
          queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY(schoolId) });
          queryClient.invalidateQueries({
            queryKey: TODAY_VALIDATIONS_KEY(schoolId),
          });
        }
      )
      .subscribe();

    channelRef.current = ch;
    return () => {
      supabase.removeChannel(ch);
    };
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
