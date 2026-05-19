import { supabase } from '@/lib/supabase/client';

export interface TimeWindow {
  start: string;
  end: string;
}

export interface PickupAuthorization {
  id: string;
  parent_id: string;
  child_id: string;
  guardian_id: string | null;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  start_time: string;
  end_time: string;
  time_windows: TimeWindow[] | null;
  timezone: string;
  reminder_before: number;
  is_active: boolean;
  expires_at: string | null;
  next_pickup_at: string | null;
  last_reminded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpsertPickupAuthorizationPayload {
  child_id: string;
  guardian_id: string;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  time_windows: TimeWindow[];
  reminder_before: number;
  is_active: boolean;
}

const PA_SELECT =
  'id, parent_id, child_id, guardian_id, monday, tuesday, wednesday, thursday, friday, start_time, end_time, time_windows, timezone, reminder_before, is_active, expires_at, next_pickup_at, last_reminded_at, created_at, updated_at';

export const pickupAuthorizationService = {
  async getForGuardian(
    childId: string,
    guardianId: string
  ): Promise<PickupAuthorization | null> {
    const { data, error } = await supabase
      .from('pickup_authorizations')
      .select(PA_SELECT)
      .eq('child_id', childId)
      .eq('guardian_id', guardianId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data as PickupAuthorization | null;
  },

  async getForChild(childId: string): Promise<PickupAuthorization[]> {
    const { data, error } = await supabase
      .from('pickup_authorizations')
      .select(PA_SELECT)
      .eq('child_id', childId)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as PickupAuthorization[];
  },

  async getCollectorSchedules(
    collectorUserId: string
  ): Promise<PickupAuthorization[]> {
    const { data: guardians, error: gErr } = await supabase
      .from('guardians')
      .select('id')
      .eq('collector_user_id', collectorUserId)
      .eq('is_active', true);
    if (gErr) throw gErr;
    if (!guardians || guardians.length === 0) return [];

    const guardianIds = guardians.map(g => g.id);
    const { data, error } = await supabase
      .from('pickup_authorizations')
      .select(PA_SELECT)
      .in('guardian_id', guardianIds)
      .eq('is_active', true)
      .order('next_pickup_at', { ascending: true });
    if (error) throw error;
    return (data ?? []) as PickupAuthorization[];
  },

  async upsert(
    payload: UpsertPickupAuthorizationPayload
  ): Promise<{ success: boolean; id?: string; next_pickup_at?: string; error?: string }> {
    const startTime = payload.time_windows[0]?.start ?? '15:00';
    const endTime = payload.time_windows[payload.time_windows.length - 1]?.end ?? '18:00';

    const { data, error } = await supabase.rpc('upsert_pickup_authorization', {
      p_child_id:        payload.child_id,
      p_guardian_id:     payload.guardian_id,
      p_monday:          payload.monday,
      p_tuesday:         payload.tuesday,
      p_wednesday:       payload.wednesday,
      p_thursday:        payload.thursday,
      p_friday:          payload.friday,
      p_time_windows:    payload.time_windows,
      p_start_time:      startTime,
      p_end_time:        endTime,
      p_reminder_before: payload.reminder_before,
      p_timezone:        'Europe/Paris',
      p_is_active:       payload.is_active,
    });
    if (error) throw error;
    return data as { success: boolean; id?: string; next_pickup_at?: string; error?: string };
  },

  async deactivate(childId: string, guardianId: string): Promise<void> {
    const { error } = await supabase
      .from('pickup_authorizations')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('child_id', childId)
      .eq('guardian_id', guardianId);
    if (error) throw error;
  },
};
