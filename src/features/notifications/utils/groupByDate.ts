import { isToday, isYesterday, format } from 'date-fns';
import { i18n } from '@/i18n';
import { dateFnsLocale } from '@/i18n/locale';
import type { Notification, NotificationGroup } from '../types';

export function groupNotificationsByDate(
  items: Notification[]
): NotificationGroup[] {
  const map = new Map<string, Notification[]>();

  for (const n of items) {
    const d = new Date(n.created_at);
    let label: string;
    if (isToday(d)) label = i18n.t('common:today');
    else if (isYesterday(d)) label = i18n.t('common:yesterday');
    else label = format(d, 'd MMMM yyyy', { locale: dateFnsLocale() });

    const bucket = map.get(label) ?? [];
    bucket.push(n);
    map.set(label, bucket);
  }

  return Array.from(map.entries()).map(([date, notifs]) => ({
    date,
    items: notifs,
  }));
}
