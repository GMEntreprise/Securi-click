import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useSession } from '@/features/auth/store/auth.store';
import { collectorService } from '../services/collector.service';
import type { CollectorGuardian, DocumentType } from '../types';

const GUARDIANS_KEY = (uid: string) => ['collector-guardians', uid] as const;
const IDENTITY_KEY = (uid: string) => ['collector-identity', uid] as const;
const LOGS_KEY = (uid: string) => ['collector-logs', uid] as const;
const PROFILE_KEY = (uid: string) => ['collector-profile', uid] as const;

export function useMyGuardians() {
  const session = useSession();
  const uid = session?.user.id ?? '';
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const query = useQuery({
    queryKey: GUARDIANS_KEY(uid),
    queryFn: () => collectorService.getMyGuardians(uid),
    enabled: !!uid,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (!uid) return;
    channelRef.current?.unsubscribe();

    const ch = supabase
      .channel(
        `collector-guardians-${uid}-${Math.random().toString(36).slice(2)}`
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'guardians',
          filter: `collector_user_id=eq.${uid}`,
        },
        payload => {
          queryClient.setQueryData<CollectorGuardian[]>(
            GUARDIANS_KEY(uid),
            old => {
              if (!old) return old;
              return old.map(g =>
                g.id === payload.new.id
                  ? { ...g, ...(payload.new as Partial<CollectorGuardian>) }
                  : g
              );
            }
          );
        }
      )
      .subscribe();

    channelRef.current = ch;
    return () => {
      ch.unsubscribe();
    };
  }, [uid, queryClient]);

  return query;
}

export function useMyIdentity() {
  const session = useSession();
  const uid = session?.user.id ?? '';

  return useQuery({
    queryKey: IDENTITY_KEY(uid),
    queryFn: () => collectorService.getMyIdentity(uid),
    enabled: !!uid,
    staleTime: 60 * 1000,
  });
}

export function useMyPickupLogs() {
  const session = useSession();
  const uid = session?.user.id ?? '';
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const query = useQuery({
    queryKey: LOGS_KEY(uid),
    queryFn: () => collectorService.getMyPickupLogs(uid),
    enabled: !!uid,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (!uid) return;
    channelRef.current?.unsubscribe();

    const ch = supabase
      .channel(`collector-logs-${uid}-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pickup_logs' },
        () => {
          queryClient.invalidateQueries({ queryKey: LOGS_KEY(uid) });
        }
      )
      .subscribe();

    channelRef.current = ch;
    return () => {
      ch.unsubscribe();
    };
  }, [uid, queryClient]);

  return query;
}

export function useCollectorProfile() {
  const session = useSession();
  const uid = session?.user.id ?? '';
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: PROFILE_KEY(uid),
    queryFn: () => collectorService.getCollectorProfile(uid),
    enabled: !!uid,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!uid) return;
    const ch = supabase
      .channel(
        `collector-profile-${uid}-${Math.random().toString(36).slice(2)}`
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_profiles',
          filter: `user_id=eq.${uid}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: PROFILE_KEY(uid) });
        }
      )
      .subscribe();
    return () => {
      ch.unsubscribe();
    };
  }, [uid, queryClient]);

  return query;
}

export function useUpdateCollectorProfile() {
  const session = useSession();
  const uid = session?.user.id ?? '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      first_name: string;
      last_name: string;
      phone: string;
    }) => collectorService.updateCollectorProfile(uid, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEY(uid) });
    },
  });
}

export function useUploadCollectorAvatar() {
  const session = useSession();
  const uid = session?.user.id ?? '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (uri: string) => collectorService.uploadAvatar(uid, uri),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEY(uid) });
    },
  });
}

export function useUploadIdentity() {
  const session = useSession();
  const uid = session?.user.id ?? '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      parentId,
      documentType,
      frontUri,
      backUri,
      selfieUri,
    }: {
      parentId: string;
      documentType: DocumentType;
      frontUri: string | null;
      backUri: string | null;
      selfieUri: string | null;
    }) => {
      const [frontPath, backPath, selfiePath] = await Promise.all([
        frontUri
          ? collectorService.uploadIdentityDocument(
              uid,
              parentId,
              'front',
              frontUri
            )
          : Promise.resolve(null),
        backUri
          ? collectorService.uploadIdentityDocument(
              uid,
              parentId,
              'back',
              backUri
            )
          : Promise.resolve(null),
        selfieUri
          ? collectorService.uploadIdentityDocument(
              uid,
              parentId,
              'selfie',
              selfieUri
            )
          : Promise.resolve(null),
      ]);
      return collectorService.upsertIdentity(
        uid,
        parentId,
        documentType,
        frontPath,
        backPath,
        selfiePath
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: IDENTITY_KEY(uid) });
      queryClient.invalidateQueries({ queryKey: GUARDIANS_KEY(uid) });
    },
  });
}

export function useAcceptInvite() {
  const queryClient = useQueryClient();
  const session = useSession();
  const uid = session?.user.id ?? '';

  return useMutation({
    mutationFn: ({
      token,
      accessCode,
    }: {
      token: string;
      accessCode: string | null;
    }) => collectorService.acceptInvite(token, accessCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GUARDIANS_KEY(uid) });
    },
  });
}
