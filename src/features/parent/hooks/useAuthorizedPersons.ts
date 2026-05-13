import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useSession } from '@/features/auth/store/auth.store';
import { parentService } from '../services/parent.service';
import type {
  AddAuthorizedPersonPayload,
  AuthorizedPerson,
  UpdateAuthorizedPersonPayload,
} from '../types';

export const AUTH_PERSONS_KEY = (childId: string) =>
  ['parent', 'authorized-persons', childId] as const;

export function useAuthorizedPersons(childId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: AUTH_PERSONS_KEY(childId),
    queryFn: () => parentService.getAuthorizedPersons(childId),
    enabled: !!childId,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!childId) return;
    const channel = supabase
      .channel(`authorized-persons-${childId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'authorized_persons',
          filter: `child_id=eq.${childId}`,
        },
        payload => {
          if (payload.eventType === 'DELETE') {
            queryClient.setQueryData<AuthorizedPerson[]>(
              AUTH_PERSONS_KEY(childId),
              prev => (prev ?? []).filter(p => p.id !== payload.old.id)
            );
          } else if (payload.eventType === 'INSERT') {
            queryClient.setQueryData<AuthorizedPerson[]>(
              AUTH_PERSONS_KEY(childId),
              prev => [payload.new as AuthorizedPerson, ...(prev ?? [])]
            );
          } else {
            queryClient.setQueryData<AuthorizedPerson[]>(
              AUTH_PERSONS_KEY(childId),
              prev =>
                (prev ?? []).map(p =>
                  p.id === payload.new.id
                    ? (payload.new as AuthorizedPerson)
                    : p
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

export function useAddAuthorizedPerson() {
  const session = useSession();
  const parentId = session?.user.id ?? '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddAuthorizedPersonPayload) =>
      parentService.addAuthorizedPerson(parentId, payload),
    onSuccess: data => {
      queryClient.invalidateQueries({
        queryKey: AUTH_PERSONS_KEY(data.child_id),
      });
    },
  });
}

export function useUpdateAuthorizedPerson(childId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      personId,
      payload,
    }: {
      personId: string;
      payload: UpdateAuthorizedPersonPayload;
    }) => parentService.updateAuthorizedPerson(personId, payload),
    onSuccess: data => {
      queryClient.setQueryData<AuthorizedPerson[]>(
        AUTH_PERSONS_KEY(childId),
        prev => (prev ?? []).map(p => (p.id === data.id ? data : p))
      );
    },
  });
}

export function useToggleAuthorizedPerson(childId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      personId,
      isActive,
    }: {
      personId: string;
      isActive: boolean;
    }) => parentService.toggleAuthorizedPerson(personId, isActive),
    onMutate: async ({ personId, isActive }) => {
      await queryClient.cancelQueries({ queryKey: AUTH_PERSONS_KEY(childId) });
      const previous = queryClient.getQueryData<AuthorizedPerson[]>(
        AUTH_PERSONS_KEY(childId)
      );
      queryClient.setQueryData<AuthorizedPerson[]>(
        AUTH_PERSONS_KEY(childId),
        prev =>
          (prev ?? []).map(p =>
            p.id === personId ? { ...p, is_active: isActive } : p
          )
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(AUTH_PERSONS_KEY(childId), ctx.previous);
      }
    },
  });
}

export function useDeleteAuthorizedPerson(childId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (personId: string) =>
      parentService.deleteAuthorizedPerson(personId),
    onMutate: async personId => {
      await queryClient.cancelQueries({ queryKey: AUTH_PERSONS_KEY(childId) });
      const previous = queryClient.getQueryData<AuthorizedPerson[]>(
        AUTH_PERSONS_KEY(childId)
      );
      queryClient.setQueryData<AuthorizedPerson[]>(
        AUTH_PERSONS_KEY(childId),
        prev => (prev ?? []).filter(p => p.id !== personId)
      );
      return { previous };
    },
    onError: (_err, _personId, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(AUTH_PERSONS_KEY(childId), ctx.previous);
      }
    },
  });
}
