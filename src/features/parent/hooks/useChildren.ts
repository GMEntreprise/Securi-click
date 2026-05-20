import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useSession } from '@/features/auth/store/auth.store';
import { subscribeToTable } from '@/lib/supabase/realtimeRegistry';
import { parentService } from '../services/parent.service';
import type { AddChildPayload, Child } from '../types';

export const CHILDREN_KEY = (parentId: string) =>
  ['parent', 'children', parentId] as const;
export const CHILD_KEY = (childId: string) =>
  ['parent', 'child', childId] as const;

export function useChildren() {
  const session = useSession();
  const parentId = session?.user.id ?? '';
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: CHILDREN_KEY(parentId),
    queryFn: () => parentService.getChildren(parentId),
    enabled: !!parentId,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!parentId) return;
    return subscribeToTable(
      `children-${parentId}`,
      { event: '*', schema: 'public', table: 'children', filter: `parent_id=eq.${parentId}` },
      payload => {
        if (payload.eventType === 'DELETE') {
          queryClient.setQueryData<Child[]>(CHILDREN_KEY(parentId), prev =>
            (prev ?? []).filter(c => c.id !== payload.old.id)
          );
        } else if (payload.eventType === 'INSERT') {
          queryClient.setQueryData<Child[]>(CHILDREN_KEY(parentId), prev => {
            const existing = prev ?? [];
            if (existing.some(c => c.id === (payload.new as Child).id))
              return existing;
            return [payload.new as Child, ...existing];
          });
        } else {
          queryClient.invalidateQueries({ queryKey: CHILDREN_KEY(parentId) });
        }
      }
    );
  }, [parentId, queryClient]);

  return query;
}

export function useChild(childId: string) {
  return useQuery({
    queryKey: CHILD_KEY(childId),
    queryFn: () => parentService.getChild(childId),
    enabled: !!childId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddChild() {
  const session = useSession();
  const parentId = session?.user.id ?? '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddChildPayload) =>
      parentService.addChild(parentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHILDREN_KEY(parentId) });
    },
  });
}

export function useUpdateChild() {
  const session = useSession();
  const parentId = session?.user.id ?? '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      childId,
      payload,
    }: {
      childId: string;
      payload: Partial<import('../types').AddChildPayload>;
    }) => parentService.updateChild(childId, payload),
    onSuccess: updated => {
      queryClient.setQueryData<Child[]>(CHILDREN_KEY(parentId), prev =>
        (prev ?? []).map(c => (c.id === updated.id ? updated : c))
      );
      queryClient.setQueryData<Child>(CHILD_KEY(updated.id), updated);
    },
  });
}

export function useDeleteChild() {
  const session = useSession();
  const parentId = session?.user.id ?? '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (childId: string) => parentService.deleteChild(childId),
    onMutate: async childId => {
      await queryClient.cancelQueries({ queryKey: CHILDREN_KEY(parentId) });
      const previous = queryClient.getQueryData<Child[]>(
        CHILDREN_KEY(parentId)
      );
      queryClient.setQueryData<Child[]>(CHILDREN_KEY(parentId), prev =>
        (prev ?? []).filter(c => c.id !== childId)
      );
      return { previous };
    },
    onError: (_err, _childId, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(CHILDREN_KEY(parentId), ctx.previous);
      }
    },
  });
}
