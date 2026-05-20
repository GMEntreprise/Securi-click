import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useSession } from '@/features/auth/store/auth.store';
import { subscribeToTable } from '@/lib/supabase/realtimeRegistry';
import { parentService } from '../services/parent.service';
import type {
  AddGuardianPayload,
  Guardian,
  UpdateGuardianPayload,
} from '../types';

export const GUARDIANS_KEY = (childId: string) =>
  ['parent', 'guardians', childId] as const;
export const EXISTING_COLLECTORS_KEY = (parentId: string) =>
  ['parent', 'existing-collectors', parentId] as const;

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
    return subscribeToTable(
      `guardians-${childId}`,
      { event: '*', schema: 'public', table: 'guardians', filter: `child_id=eq.${childId}` },
      payload => {
        if (payload.eventType === 'DELETE') {
          queryClient.setQueryData<Guardian[]>(GUARDIANS_KEY(childId), prev =>
            (prev ?? []).filter(g => g.id !== payload.old.id)
          );
        } else if (payload.eventType === 'INSERT') {
          queryClient.setQueryData<Guardian[]>(GUARDIANS_KEY(childId), prev => {
            const existing = prev ?? [];
            if (existing.some(g => g.id === (payload.new as Guardian).id))
              return existing;
            return [payload.new as Guardian, ...existing];
          });
        } else {
          queryClient.setQueryData<Guardian[]>(GUARDIANS_KEY(childId), prev =>
            (prev ?? []).map(g =>
              g.id === payload.new.id ? (payload.new as Guardian) : g
            )
          );
        }
      }
    );
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
      await queryClient.cancelQueries({ queryKey: ['guardian', guardianId] });
      const previous = queryClient.getQueryData<Guardian[]>(
        GUARDIANS_KEY(childId)
      );
      // Optimistic update on the list
      queryClient.setQueryData<Guardian[]>(GUARDIANS_KEY(childId), prev =>
        (prev ?? []).map(g =>
          g.id === guardianId ? { ...g, is_active: isActive } : g
        )
      );
      // Optimistic update on the individual guardian query used by guardian-edit
      queryClient.setQueryData<Guardian>(['guardian', guardianId], prev =>
        prev ? { ...prev, is_active: isActive } : prev
      );
      return { previous };
    },
    onError: (_err, { guardianId }, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(GUARDIANS_KEY(childId), ctx.previous);
      }
      queryClient.invalidateQueries({ queryKey: ['guardian', guardianId] });
    },
    onSettled: (_data, _err, { guardianId }) => {
      queryClient.invalidateQueries({ queryKey: ['guardian', guardianId] });
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

export function useExistingCollectors() {
  const session = useSession();
  const parentId = session?.user.id ?? '';
  return useQuery({
    queryKey: EXISTING_COLLECTORS_KEY(parentId),
    queryFn: () => parentService.getExistingCollectors(parentId),
    enabled: !!parentId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useLinkCollector(childId: string) {
  const session = useSession();
  const parentId = session?.user.id ?? '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      collector_user_id: string;
      first_name: string;
      last_name: string;
      phone: string | null;
      email: string | null;
      relationship: string;
    }) => parentService.linkCollectorToChild(parentId, childId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GUARDIANS_KEY(childId) });
      queryClient.invalidateQueries({ queryKey: EXISTING_COLLECTORS_KEY(parentId) });
    },
  });
}
