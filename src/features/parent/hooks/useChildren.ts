import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useSession } from '@/features/auth/store/auth.store';
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
    const channel = supabase
      .channel(`children-${parentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'children',
          filter: `parent_user_id=eq.${parentId}`,
        },
        payload => {
          if (payload.eventType === 'DELETE') {
            queryClient.setQueryData<Child[]>(CHILDREN_KEY(parentId), prev =>
              (prev ?? []).filter(c => c.id !== payload.old.id)
            );
          } else if (payload.eventType === 'INSERT') {
            queryClient.setQueryData<Child[]>(CHILDREN_KEY(parentId), prev => [
              payload.new as Child,
              ...(prev ?? []),
            ]);
          } else {
            queryClient.setQueryData<Child[]>(CHILDREN_KEY(parentId), prev =>
              (prev ?? []).map(c =>
                c.id === payload.new.id ? (payload.new as Child) : c
              )
            );
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
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
