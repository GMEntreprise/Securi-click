import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useSession } from '@/features/auth/store/auth.store';
import { parentService } from '../services/parent.service';
import type {
  AddGuardianPayload,
  Guardian,
  UpdateGuardianPayload,
} from '../types';

export const GUARDIANS_KEY = (childId: string) =>
  ['parent', 'guardians', childId] as const;

export function useGuardians(childId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: GUARDIANS_KEY(childId),
    queryFn: () => parentService.getGuardians(childId),
    enabled: !!childId,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!childId) return;
    const channel = supabase
      .channel(`guardians-${childId}-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'guardians',
          filter: `child_id=eq.${childId}`,
        },
        payload => {
          if (payload.eventType === 'DELETE') {
            queryClient.setQueryData<Guardian[]>(GUARDIANS_KEY(childId), prev =>
              (prev ?? []).filter(g => g.id !== payload.old.id)
            );
          } else if (payload.eventType === 'INSERT') {
            queryClient.setQueryData<Guardian[]>(
              GUARDIANS_KEY(childId),
              prev => {
                const existing = prev ?? [];
                if (existing.some(g => g.id === (payload.new as Guardian).id))
                  return existing;
                return [payload.new as Guardian, ...existing];
              }
            );
          } else {
            queryClient.setQueryData<Guardian[]>(GUARDIANS_KEY(childId), prev =>
              (prev ?? []).map(g =>
                g.id === payload.new.id ? (payload.new as Guardian) : g
              )
            );
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [childId, queryClient]);

  return query;
}

export function useAddGuardian() {
  const session = useSession();
  const parentId = session?.user.id ?? '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddGuardianPayload) =>
      parentService.addGuardian(parentId, payload),
    onSuccess: data => {
      queryClient.invalidateQueries({
        queryKey: GUARDIANS_KEY(data.child_id),
      });
    },
  });
}

export function useUpdateGuardian(childId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      guardianId,
      payload,
    }: {
      guardianId: string;
      payload: UpdateGuardianPayload;
    }) => parentService.updateGuardian(guardianId, payload),
    onSuccess: data => {
      queryClient.setQueryData<Guardian[]>(GUARDIANS_KEY(childId), prev =>
        (prev ?? []).map(g => (g.id === data.id ? data : g))
      );
    },
  });
}

export function useToggleGuardian(childId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      guardianId,
      isActive,
    }: {
      guardianId: string;
      isActive: boolean;
    }) => parentService.toggleGuardian(guardianId, isActive),
    onMutate: async ({ guardianId, isActive }) => {
      await queryClient.cancelQueries({ queryKey: GUARDIANS_KEY(childId) });
      const previous = queryClient.getQueryData<Guardian[]>(
        GUARDIANS_KEY(childId)
      );
      queryClient.setQueryData<Guardian[]>(GUARDIANS_KEY(childId), prev =>
        (prev ?? []).map(g =>
          g.id === guardianId ? { ...g, is_active: isActive } : g
        )
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(GUARDIANS_KEY(childId), ctx.previous);
      }
    },
  });
}

export function useDeleteGuardian(childId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (guardianId: string) =>
      parentService.deleteGuardian(guardianId),
    onMutate: async guardianId => {
      await queryClient.cancelQueries({ queryKey: GUARDIANS_KEY(childId) });
      const previous = queryClient.getQueryData<Guardian[]>(
        GUARDIANS_KEY(childId)
      );
      queryClient.setQueryData<Guardian[]>(GUARDIANS_KEY(childId), prev =>
        (prev ?? []).filter(g => g.id !== guardianId)
      );
      return { previous };
    },
    onError: (_err, _guardianId, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(GUARDIANS_KEY(childId), ctx.previous);
      }
    },
  });
}
