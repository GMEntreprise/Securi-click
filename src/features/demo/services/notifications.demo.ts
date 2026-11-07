import type { NotificationsApi } from '@/features/notifications/api/notifications.api';
import { nowIso, readWorld, writeWorld } from './world';

export const demoNotificationsApi: NotificationsApi = {
  async fetchNotifications(userId) {
    return readWorld().notifications.filter(n => n.user_id === userId);
  },

  async fetchUnreadCount(userId) {
    return readWorld().notifications.filter(
      n => n.user_id === userId && !n.is_read
    ).length;
  },

  async markNotificationsRead(ids) {
    writeWorld(world => ({
      ...world,
      notifications: world.notifications.map(n =>
        ids.includes(n.id) ? { ...n, is_read: true, read_at: nowIso() } : n
      ),
    }));
  },

  async markAllRead() {
    writeWorld(world => ({
      ...world,
      notifications: world.notifications.map(n => ({
        ...n,
        is_read: true,
        read_at: nowIso(),
      })),
    }));
  },

  async upsertPushToken() {},

  async deactivatePushToken() {},
};
