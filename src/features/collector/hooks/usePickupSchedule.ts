import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { i18n } from '@/i18n';
import { appLocale } from '@/i18n/locale';
import { useSession } from '@/features/auth/store/auth.store';
import { subscribeToTable } from '@/lib/supabase/realtimeRegistry';
import {
  pickupAuthorizationService,
  type PickupAuthorization,
} from '@/features/parent/services/pickupAuthorization.service';

export const COLLECTOR_SCHEDULE_KEY = (collectorUserId: string) =>
  ['collector', 'pickup_schedules', collectorUserId] as const;

const DAY_LABEL_KEYS: Record<string, string> = {
  monday: 'common:day_monday',
  tuesday: 'common:day_tuesday',
  wednesday: 'common:day_wednesday',
  thursday: 'common:day_thursday',
  friday: 'common:day_friday',
};

const DOW_TO_KEY: Record<number, keyof PickupAuthorization> = {
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
};

export function getActiveDayLabels(auth: PickupAuthorization): string[] {
  return Object.entries(DAY_LABEL_KEYS)
    .filter(([key]) => auth[key as keyof PickupAuthorization] === true)
    .map(([, labelKey]) => i18n.t(labelKey));
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

  const time = d.toLocaleTimeString(appLocale(), {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (isSameDay(d, today)) return i18n.t('common:today_at', { time });
  if (isSameDay(d, tomorrow)) return i18n.t('common:tomorrow_at', { time });

  const dayName = d.toLocaleDateString(appLocale(), { weekday: 'long' });
  return i18n.t('common:day_at', {
    day: dayName.charAt(0).toUpperCase() + dayName.slice(1),
    time,
  });
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
      () => {
        queryClient.invalidateQueries({
          queryKey: COLLECTOR_SCHEDULE_KEY(collectorUserId),
        });
      }
    );
  }, [collectorUserId, queryClient]);

  return query;
}
