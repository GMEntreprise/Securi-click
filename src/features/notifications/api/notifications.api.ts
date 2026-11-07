import { supabase } from '@/lib/supabase/client';
import { toUserFacingError } from '@/shared/errors/supabaseError';
import type { Notification } from '../types';
import { demoAware } from '@/features/demo/services/demoAware';
import { demoNotificationsApi } from '@/features/demo/services/notifications.demo';

const COLUMNS =
  'id,user_id,role,type,title,body,metadata,is_read,read_at,created_at,expires_at' as const;

async function fetchNotificationsFromSupabase(
  userId: string
): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select(COLUMNS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(60);

  if (error) throw toUserFacingError(error);
  return (data ?? []) as Notification[];
}

async function fetchUnreadCountFromSupabase(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) throw toUserFacingError(error);
  return count ?? 0;
}

async function markNotificationsReadFromSupabase(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabase.rpc('mark_notifications_read', {
    p_notification_ids: ids,
  });
  if (error) throw toUserFacingError(error);
}

async function markAllReadFromSupabase(): Promise<void> {
  const { error } = await supabase.rpc('mark_all_notifications_read');
  if (error) throw toUserFacingError(error);
}

async function upsertPushTokenFromSupabase(
  token: string,
  platform: 'ios' | 'android' | 'web'
): Promise<void> {
  const { error } = await supabase.rpc('upsert_push_token', {
    p_token: token,
    p_platform: platform,
  });
  if (error) throw toUserFacingError(error);
}

async function deactivatePushTokenFromSupabase(token: string): Promise<void> {
  const { error } = await supabase
    .from('push_tokens')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('token', token);
  if (error) throw toUserFacingError(error);
}

const supabaseNotificationsApi = {
  fetchNotifications: fetchNotificationsFromSupabase,
  fetchUnreadCount: fetchUnreadCountFromSupabase,
  markNotificationsRead: markNotificationsReadFromSupabase,
  markAllRead: markAllReadFromSupabase,
  upsertPushToken: upsertPushTokenFromSupabase,
  deactivatePushToken: deactivatePushTokenFromSupabase,
};

export type NotificationsApi = typeof supabaseNotificationsApi;

export const {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationsRead,
  markAllRead,
  upsertPushToken,
  deactivatePushToken,
}: NotificationsApi = demoAware(supabaseNotificationsApi, demoNotificationsApi);
