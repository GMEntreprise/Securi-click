import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useSession } from '@/features/auth/store/auth.store';
import { collectorService } from '../services/collector.service';
import type { CollectorGuardian, DocumentType } from '../types';
import type { PendingInvite, CollectorQrCode, CollectorRecentScan } from '../services/collector.service';

export const GUARDIANS_KEY = (uid: string) => ['collector-guardians', uid] as const;
export const IDENTITY_KEY = (uid: string) => ['collector-identity', uid] as const;
export const LOGS_KEY = (uid: string) => ['collector-logs', uid] as const;
export const PROFILE_KEY = (uid: string) => ['collector-profile', uid] as const;
export const QR_KEY = (uid: string, childId?: string) => ['collector-qr', uid, childId ?? 'all'] as const;
export const SCANS_KEY = (uid: string, childId?: string) => ['collector-scans', uid, childId ?? 'all'] as const;

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

    const ch = supabase
      .channel(`collector-guardians-${uid}`)
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
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'guardians',
          filter: `collector_user_id=eq.${uid}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: GUARDIANS_KEY(uid) });
        }
      )
      .subscribe();

    channelRef.current = ch;

    const childCh = supabase
      .channel(`collector-children-${uid}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'children' },
        () => {
          queryClient.invalidateQueries({ queryKey: GUARDIANS_KEY(uid) });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
      supabase.removeChannel(childCh);
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

    const ch = supabase
      .channel(`collector-logs-${uid}`)
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
      supabase.removeChannel(ch);
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
      .channel(`collector-profile-${uid}`)
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
      supabase.removeChannel(ch);
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

export function useUpdateCollectorAvatarUrl() {
  const session = useSession();
  const uid = session?.user.id ?? '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (avatarUrl: string) =>
      collectorService.updateAvatarUrl(uid, avatarUrl),
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

export function usePendingInvites() {
  const session = useSession();
  const email = session?.user.email ?? '';

  return useQuery({
    queryKey: ['collector-pending-invites', email],
    queryFn: () => collectorService.getPendingInvitesByEmail(email),
    enabled: !!email,
    staleTime: 0,
    gcTime: 0,
  });
}

export function useAcceptInvite() {
  const queryClient = useQueryClient();
  const session = useSession();
  const uid = session?.user.id ?? '';
  const email = session?.user.email ?? '';

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
      queryClient.invalidateQueries({ queryKey: ['collector-pending-invites', email] });
    },
  });
}

// ── QR code — collector-owned, no parent dependency ─────────────────────────

export function useCollectorQrCode(childId?: string) {
  const session = useSession();
  const uid = session?.user.id ?? '';
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const query = useQuery({
    queryKey: QR_KEY(uid, childId),
    queryFn: () => collectorService.getCollectorQrCode(uid, childId),
    enabled: !!uid,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (!uid) return;

    const ch = supabase
      .channel(`collector-qr-${uid}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'qr_codes' },
        () => {
          queryClient.invalidateQueries({ queryKey: QR_KEY(uid, childId) });
        }
      )
      .subscribe();

    channelRef.current = ch;
    return () => {
      supabase.removeChannel(ch);
    };
  }, [uid, childId, queryClient]);

  return query;
}

export function useCollectorRecentScans(childId?: string) {
  const session = useSession();
  const uid = session?.user.id ?? '';
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const query = useQuery({
    queryKey: SCANS_KEY(uid, childId),
    queryFn: () => collectorService.getCollectorRecentScans(uid, childId),
    enabled: !!uid,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (!uid) return;

    const ch = supabase
      .channel(`collector-scans-${uid}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pickup_logs' },
        () => {
          queryClient.invalidateQueries({ queryKey: SCANS_KEY(uid, childId) });
        }
      )
      .subscribe();

    channelRef.current = ch;
    return () => {
      supabase.removeChannel(ch);
    };
  }, [uid, childId, queryClient]);

  return query;
}

export function useCollectorGenerateQr() {
  const session = useSession();
  const uid = session?.user.id ?? '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ childId, guardianId }: { childId: string; guardianId: string }) =>
      collectorService.generateCollectorQrCode(uid, childId, guardianId),
    onSuccess: (_data, { childId }) => {
      queryClient.invalidateQueries({ queryKey: QR_KEY(uid, childId) });
      queryClient.invalidateQueries({ queryKey: QR_KEY(uid) });
    },
  });
}

export type { PendingInvite, CollectorQrCode, CollectorRecentScan };
