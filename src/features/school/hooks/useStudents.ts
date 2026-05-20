import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { schoolService } from '../services/school.service';
import { subscribeToTable } from '@/lib/supabase/realtimeRegistry';

export const STUDENTS_KEY = (schoolId: string) =>
  ['school', 'students', schoolId] as const;

export function useStudents(schoolId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: STUDENTS_KEY(schoolId),
    queryFn: () => schoolService.getEnrolledChildren(schoolId),
    enabled: !!schoolId,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (!schoolId) return;

    return subscribeToTable(
      `school-students-${schoolId}`,
      { event: '*', schema: 'public', table: 'children', filter: `school_id=eq.${schoolId}` },
      () => {
        queryClient.invalidateQueries({ queryKey: STUDENTS_KEY(schoolId) });
      }
    );
  }, [schoolId, queryClient]);

  return query;
}
