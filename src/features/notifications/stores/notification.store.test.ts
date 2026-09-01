import { beforeEach, describe, expect, it } from '@jest/globals';
import { useNotificationStore } from './notification.store';
import type { Notification } from '../types';

const notification = {
  id: 'n1',
  user_id: 'parent-1',
  role: 'parent',
  type: 'pickup',
  title: 'Récupération confirmée',
  body: 'Lucie a été récupérée par Marie',
  metadata: {},
  is_read: false,
  read_at: null,
  delivery_state: 'delivered',
  created_at: '2026-09-01T10:00:00.000Z',
} as unknown as Notification;

describe('notification store', () => {
  beforeEach(() => {
    useNotificationStore.getState().reset();
  });

  it('leaves no notification content behind after a reset', () => {
    const store = useNotificationStore.getState();
    store.setItems([notification]);
    store.setUnreadCount(3);
    store.openCenter();

    useNotificationStore.getState().reset();

    const after = useNotificationStore.getState();
    expect(after.items).toEqual([]);
    expect(after.unreadCount).toBe(0);
    expect(after.centerOpen).toBe(false);
  });

  it('is safe to reset an already empty store', () => {
    useNotificationStore.getState().reset();
    const after = useNotificationStore.getState();
    expect(after.items).toEqual([]);
    expect(after.unreadCount).toBe(0);
  });
});
