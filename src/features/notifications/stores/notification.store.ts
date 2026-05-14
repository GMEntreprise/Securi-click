import { create } from 'zustand';
import type { Notification } from '../types';

interface NotificationState {
  // Optimistic unread count — kept in sync by realtime + mark-read mutations
  unreadCount: number;
  // Notifications loaded for the center (subset, not full history)
  items: Notification[];
  // Whether the notification center is open
  centerOpen: boolean;

  setUnreadCount: (count: number) => void;
  incrementUnread: () => void;
  decrementUnread: (by?: number) => void;
  resetUnread: () => void;

  setItems: (items: Notification[]) => void;
  prependItem: (item: Notification) => void;
  markReadLocally: (ids: string[]) => void;
  markAllReadLocally: () => void;

  openCenter: () => void;
  closeCenter: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  unreadCount: 0,
  items: [],
  centerOpen: false,

  setUnreadCount: count => set({ unreadCount: Math.max(0, count) }),
  incrementUnread: () => set(s => ({ unreadCount: s.unreadCount + 1 })),
  decrementUnread: (by = 1) => set(s => ({ unreadCount: Math.max(0, s.unreadCount - by) })),
  resetUnread: () => set({ unreadCount: 0 }),

  setItems: items => set({ items }),
  prependItem: item =>
    set(s => ({
      items: [item, ...s.items.filter(n => n.id !== item.id)],
    })),
  markReadLocally: ids =>
    set(s => ({
      items: s.items.map(n =>
        ids.includes(n.id)
          ? { ...n, is_read: true, read_at: new Date().toISOString() }
          : n
      ),
    })),
  markAllReadLocally: () =>
    set(s => ({
      items: s.items.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() })),
    })),

  openCenter: () => set({ centerOpen: true }),
  closeCenter: () => set({ centerOpen: false }),
}));

// Stable selectors — zero re-render on unrelated state changes
export const useUnreadCount = () => useNotificationStore(s => s.unreadCount);
export const useNotificationItems = () => useNotificationStore(s => s.items);
export const useNotificationCenterOpen = () => useNotificationStore(s => s.centerOpen);
