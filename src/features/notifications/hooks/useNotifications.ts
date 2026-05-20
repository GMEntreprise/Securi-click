import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useSession } from '@/features/auth/store/auth.store';
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationsRead,
  markAllRead,
} from '../api/notifications.api';
import { useNotificationStore } from '../stores/notification.store';
import type { Notification } from '../types';

export const NOTIFICATIONS_KEY = (userId: string) => ['notifications', userId] as const;
export const UNREAD_COUNT_KEY = (userId: string) => ['notifications', 'unread', userId] as const;

// ─── Main list query ────────────────────────────────────────────────────────

export function useNotificationsList() {
  const session = useSession();
  const userId = session?.user.id;
  const setItems = useNotificationStore(s => s.setItems);
  const setUnread = useNotificationStore(s => s.setUnreadCount);

  const query = useQuery({
    queryKey: userId ? NOTIFICATIONS_KEY(userId) : ['notifications', 'none'],
    queryFn: () => fetchNotifications(userId!),
    enabled: !!userId,
    staleTime: 30_000,
    select: data => data,
  });

  useEffect(() => {
    if (query.data) {
      setItems(query.data);
      setUnread(query.data.filter(n => !n.is_read).length);
    }
  }, [query.data, setItems, setUnread]);

  return query;
}

// ─── Unread count query ─────────────────────────────────────────────────────

export function useUnreadCountQuery() {
  const session = useSession();
  const userId = session?.user.id;
  const setUnread = useNotificationStore(s => s.setUnreadCount);

  const query = useQuery({
    queryKey: userId ? UNREAD_COUNT_KEY(userId) : ['notifications', 'unread', 'none'],
    queryFn: () => fetchUnreadCount(userId!),
    enabled: !!userId,
    staleTime: 10_000,
    refetchInterval: 60_000,
  });

  useEffect(() => {
    if (typeof query.data === 'number') setUnread(query.data);
  }, [query.data, setUnread]);

  return query;
}

// ─── Realtime subscription — one channel per user, no duplicates ────────────

export function useNotificationsRealtime() {
  const session = useSession();
  const userId = session?.user.id;
  const qc = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const instanceRef = useRef(0);
  const prependItem = useNotificationStore(s => s.prependItem);
  const incrementUnread = useNotificationStore(s => s.incrementUnread);

  useEffect(() => {
    if (!userId) return;

    const prev = channelRef.current;
    if (prev) supabase.removeChannel(prev);

    const id = ++instanceRef.current;
    const channel = supabase
      .channel(`notifications:${userId}-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        payload => {
          const newItem = payload.new as Notification;
          prependItem(newItem);
          if (!newItem.is_read) incrementUnread();
          // Invalidate so the list query stays fresh on next focus
          qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY(userId) });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, qc, prependItem, incrementUnread]);
}

// ─── Mark single / batch read ───────────────────────────────────────────────

export function useMarkRead() {
  const session = useSession();
  const userId = session?.user.id;
  const qc = useQueryClient();
  const markReadLocally = useNotificationStore(s => s.markReadLocally);
  const decrementUnread = useNotificationStore(s => s.decrementUnread);

  return useMutation({
    mutationFn: (ids: string[]) => markNotificationsRead(ids),
    onMutate: async ids => {
      // Optimistic update — instant UI before server confirms
      const previous = qc.getQueryData<Notification[]>(
        userId ? NOTIFICATIONS_KEY(userId) : []
      );
      const unreadIds = (previous ?? [])
        .filter(n => ids.includes(n.id) && !n.is_read)
        .map(n => n.id);

      markReadLocally(ids);
      decrementUnread(unreadIds.length);

      return { previous, unreadIds };
    },
    onError: (_err, _ids, ctx) => {
      // Rollback on failure
      if (ctx?.previous && userId) {
        qc.setQueryData(NOTIFICATIONS_KEY(userId), ctx.previous);
      }
      if (ctx?.unreadIds) {
        useNotificationStore.getState().setUnreadCount(
          (qc.getQueryData<Notification[]>(userId ? NOTIFICATIONS_KEY(userId) : []) ?? [])
            .filter(n => !n.is_read).length
        );
      }
    },
    onSettled: () => {
      if (userId) {
        qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY(userId) });
        qc.invalidateQueries({ queryKey: UNREAD_COUNT_KEY(userId) });
      }
    },
  });
}

// ─── Mark all read ──────────────────────────────────────────────────────────

export function useMarkAllRead() {
  const session = useSession();
  const userId = session?.user.id;
  const qc = useQueryClient();
  const markAllReadLocally = useNotificationStore(s => s.markAllReadLocally);
  const resetUnread = useNotificationStore(s => s.resetUnread);

  return useMutation({
    mutationFn: markAllRead,
    onMutate: () => {
      markAllReadLocally();
      resetUnread();
    },
    onSettled: () => {
      if (userId) {
        qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY(userId) });
        qc.invalidateQueries({ queryKey: UNREAD_COUNT_KEY(userId) });
      }
    },
  });
}
