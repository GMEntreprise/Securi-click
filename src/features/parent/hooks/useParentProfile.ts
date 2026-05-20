import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useSession } from '@/features/auth/store/auth.store';
import { subscribeToTable } from '@/lib/supabase/realtimeRegistry';
import { parentService } from '../services/parent.service';
import type { UpdateProfilePayload } from '../types';

export const PARENT_PROFILE_KEY = (userId: string) =>
  ['parent', 'profile', userId] as const;

export function useParentProfile() {
  const session = useSession();
  const userId = session?.user.id ?? '';
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: PARENT_PROFILE_KEY(userId),
    queryFn: () => parentService.getProfile(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!userId) return;
    return subscribeToTable(
      `parent-profile-${userId}`,
      { event: '*', schema: 'public', table: 'user_profiles', filter: `user_id=eq.${userId}` },
      () => { queryClient.invalidateQueries({ queryKey: PARENT_PROFILE_KEY(userId) }); }
    );
  }, [userId, queryClient]);

  return query;
}

export function useUpdateProfile() {
  const session = useSession();
  const userId = session?.user.id ?? '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      parentService.updateProfile(userId, payload),
    onSuccess: data => {
      queryClient.setQueryData(PARENT_PROFILE_KEY(userId), data);
    },
  });
}

export function useUpdateAvatar() {
  const session = useSession();
  const userId = session?.user.id ?? '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (avatarUrl: string) =>
      parentService.updateAvatar(userId, avatarUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PARENT_PROFILE_KEY(userId) });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (newPassword: string) =>
      parentService.changePassword(newPassword),
  });
}
