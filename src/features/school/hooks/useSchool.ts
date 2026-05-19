import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useSession } from '@/features/auth/store/auth.store';
import { schoolService } from '../services/school.service';
import type { UpdateSchoolPayload } from '../types';

export const SCHOOL_KEY = (id: string) => ['school', id] as const;
export const SCHOOL_BY_ADMIN_KEY = (uid: string) =>
  ['school', 'by-admin', uid] as const;

export function useMySchool() {
  const session = useSession();
  const uid = session?.user.id ?? '';
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const query = useQuery({
    queryKey: SCHOOL_BY_ADMIN_KEY(uid),
    queryFn: () => schoolService.getSchoolByAdminUserId(uid),
    enabled: !!uid,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const schoolId = query.data?.id;
    if (!uid || !schoolId) return;
    if (channelRef.current) supabase.removeChannel(channelRef.current);

    const ch = supabase
      .channel(`school-profile-${schoolId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'schools',
          filter: `id=eq.${schoolId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: SCHOOL_BY_ADMIN_KEY(uid) });
          queryClient.invalidateQueries({ queryKey: SCHOOL_KEY(schoolId) });
        }
      )
      .subscribe();

    channelRef.current = ch;
    return () => {
      supabase.removeChannel(ch);
    };
  }, [uid, query.data?.id, queryClient]);

  return query;
}

export function useUpdateSchool() {
  const session = useSession();
  const uid = session?.user.id ?? '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      schoolId,
      payload,
    }: {
      schoolId: string;
      payload: UpdateSchoolPayload;
    }) => schoolService.updateSchool(schoolId, payload),
    onSuccess: updated => {
      queryClient.setQueryData(SCHOOL_BY_ADMIN_KEY(uid), updated);
      queryClient.setQueryData(SCHOOL_KEY(updated.id), updated);
    },
  });
}

export function useUpdateSchoolLogo() {
  const session = useSession();
  const uid = session?.user.id ?? '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      schoolId,
      logoUrl,
    }: {
      schoolId: string;
      logoUrl: string;
    }) => schoolService.updateSchoolLogo(schoolId, logoUrl),
    onSuccess: (_, { schoolId }) => {
      queryClient.invalidateQueries({ queryKey: SCHOOL_BY_ADMIN_KEY(uid) });
      queryClient.invalidateQueries({ queryKey: SCHOOL_KEY(schoolId) });
    },
  });
}
