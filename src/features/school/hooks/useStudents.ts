import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { schoolService } from '../services/school.service';

export const STUDENTS_KEY = (schoolId: string) =>
  ['school', 'students', schoolId] as const;

export function useStudents(schoolId: string) {
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const instanceRef = useRef(0);

  const query = useQuery({
    queryKey: STUDENTS_KEY(schoolId),
    queryFn: () => schoolService.getEnrolledChildren(schoolId),
    enabled: !!schoolId,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (!schoolId) return;

    const prev = channelRef.current;
    if (prev) supabase.removeChannel(prev);

    const id = ++instanceRef.current;
    const ch = supabase
      .channel(`school-students-${schoolId}-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'children',
          filter: `school_id=eq.${schoolId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: STUDENTS_KEY(schoolId) });
        }
      )
      .subscribe();

    channelRef.current = ch;

    return () => {
      supabase.removeChannel(ch);
      channelRef.current = null;
    };
  }, [schoolId, queryClient]);

  return query;
}
