import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useSession } from '@/features/auth/store/auth.store';
import { subscribeToTable } from '@/lib/supabase/realtimeRegistry';
import { pickupAuthorizationService, type PickupAuthorization } from '@/features/parent/services/pickupAuthorization.service';

export const COLLECTOR_SCHEDULE_KEY = (collectorUserId: string) =>
  ['collector', 'pickup_schedules', collectorUserId] as const;

const DAY_LABELS: Record<string, string> = {
  monday: 'Lundi',
  tuesday: 'Mardi',
  wednesday: 'Mercredi',
  thursday: 'Jeudi',
  friday: 'Vendredi',
};

const DOW_TO_KEY: Record<number, keyof PickupAuthorization> = {
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
};

export function getActiveDayLabels(auth: PickupAuthorization): string[] {
  return (
    Object.entries(DAY_LABELS)
      .filter(([key]) => auth[key as keyof PickupAuthorization] === true)
      .map(([, label]) => label)
  );
}

export function isTodayAuthorized(auth: PickupAuthorization): boolean {
  const dow = new Date().getDay(); // 0=Sun..6=Sat
  const isodow = dow === 0 ? 7 : dow;
  const key = DOW_TO_KEY[isodow];
  if (!key) return false;
  return auth[key] === true;
}

export function formatTimeWindows(auth: PickupAuthorization): string {
  if (auth.time_windows && auth.time_windows.length > 0) {
    return auth.time_windows
      .map(w => `${w.start.slice(0, 5)} → ${w.end.slice(0, 5)}`)
      .join('  •  ');
  }
  if (auth.start_time && auth.end_time) {
    return `${auth.start_time.slice(0, 5)} → ${auth.end_time.slice(0, 5)}`;
  }
  return '—';
}

export function getNextPickupLabel(auth: PickupAuthorization): string | null {
  if (!auth.next_pickup_at) return null;
  const d = new Date(auth.next_pickup_at);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  if (isSameDay(d, today)) return `Aujourd'hui à ${time}`;
  if (isSameDay(d, tomorrow)) return `Demain à ${time}`;

  const dayName = d.toLocaleDateString('fr-FR', { weekday: 'long' });
  return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} à ${time}`;
}

export function useCollectorPickupSchedules() {
  const session = useSession();
  const collectorUserId = session?.user.id ?? '';
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: COLLECTOR_SCHEDULE_KEY(collectorUserId),
    queryFn: () =>
      pickupAuthorizationService.getCollectorSchedules(collectorUserId),
    enabled: !!collectorUserId,
    staleTime: 2 * 60 * 1000,
  });

  useEffect(() => {
    if (!collectorUserId) return;
    return subscribeToTable(
      `collector-schedules-${collectorUserId}`,
      { event: '*', schema: 'public', table: 'pickup_authorizations' },
      () => { queryClient.invalidateQueries({ queryKey: COLLECTOR_SCHEDULE_KEY(collectorUserId) }); }
    );
  }, [collectorUserId, queryClient]);

  return query;
}
