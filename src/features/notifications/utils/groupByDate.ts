import { isToday, isYesterday, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Notification, NotificationGroup } from '../types';

export function groupNotificationsByDate(items: Notification[]): NotificationGroup[] {
  const map = new Map<string, Notification[]>();

  for (const n of items) {
    const d = new Date(n.created_at);
    let label: string;
    if (isToday(d)) label = "Aujourd'hui";
    else if (isYesterday(d)) label = 'Hier';
    else label = format(d, 'd MMMM yyyy', { locale: fr });

    const bucket = map.get(label) ?? [];
    bucket.push(n);
    map.set(label, bucket);
  }

  return Array.from(map.entries()).map(([date, notifs]) => ({ date, items: notifs }));
}
