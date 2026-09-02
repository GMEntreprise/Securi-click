import { supabase } from '@/lib/supabase/client';
import { toUserFacingError } from '@/shared/errors/supabaseError';
import type { Notification } from '../types';

const COLUMNS =
  'id,user_id,role,type,title,body,metadata,is_read,read_at,created_at,expires_at' as const;

export async function fetchNotifications(
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

export async function fetchUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) throw toUserFacingError(error);
  return count ?? 0;
}

export async function markNotificationsRead(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabase.rpc('mark_notifications_read', {
    p_notification_ids: ids,
  });
  if (error) throw toUserFacingError(error);
}

export async function markAllRead(): Promise<void> {
  const { error } = await supabase.rpc('mark_all_notifications_read');
  if (error) throw toUserFacingError(error);
}

export async function upsertPushToken(
  token: string,
  platform: 'ios' | 'android' | 'web'
): Promise<void> {
  const { error } = await supabase.rpc('upsert_push_token', {
    p_token: token,
    p_platform: platform,
  });
  if (error) throw toUserFacingError(error);
}

export async function deactivatePushToken(token: string): Promise<void> {
  const { error } = await supabase
    .from('push_tokens')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('token', token);
  if (error) throw toUserFacingError(error);
}
