import React, { memo, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SectionList,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { useAppNavigation } from '@/navigation/useAppNavigation';
import { NotificationItem } from '../components/NotificationItem';
import {
  useNotificationsList,
  useMarkRead,
  useMarkAllRead,
  useNotificationsRealtime,
} from '../hooks/useNotifications';
import {
  useNotificationStore,
  useUnreadCount,
} from '../stores/notification.store';
import { groupNotificationsByDate } from '../utils/groupByDate';
import { NOTIFICATION_ROUTES } from '../utils/constants';
import type { Notification } from '../types';

export const NotificationCenterScreen = memo(() => {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const nav = useAppNavigation();
  const closeCenter = useNotificationStore(s => s.closeCenter);
  const unread = useUnreadCount();

  const { data: notifications, isLoading } = useNotificationsList();
  useNotificationsRealtime();

  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const sections = useMemo(
    () =>
      groupNotificationsByDate(notifications ?? []).map(g => ({
        title: g.date,
        data: g.items,
      })),
    [notifications]
  );

  const handlePress = useCallback(
    (item: Notification) => {
      if (!item.is_read) {
        markRead.mutate([item.id]);
      }
      const route = item.metadata?.route ?? NOTIFICATION_ROUTES[item.type];
      if (route) {
        closeCenter();
        nav.pushRoute(route);
      }
    },
    [markRead, closeCenter, nav]
  );

  const handleMarkAllRead = useCallback(() => {
    markAllRead.mutate();
  }, [markAllRead]);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingTop: insets.top + 8,
          paddingBottom: 12,
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: t.separator,
          backgroundColor: t.card,
        }}
      >
        <Text
          style={{ flex: 1, fontSize: 18, fontWeight: '800', color: t.text }}
        >
          Notifications
          {unread > 0 && (
            <Text
              style={{ fontSize: 14, fontWeight: '600', color: t.textMuted }}
            >
              {'  '}
              {unread} non lue{unread > 1 ? 's' : ''}
            </Text>
          )}
        </Text>

        {unread > 0 && (
          <Pressable
            onPress={handleMarkAllRead}
            hitSlop={8}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              marginRight: 16,
            }}
          >
            <Ionicons
              name="checkmark-done-outline"
              size={16}
              color={t.accent}
            />
            <Text style={{ fontSize: 13, color: t.accent, fontWeight: '600' }}>
              Tout lire
            </Text>
          </Pressable>
        )}

        <Pressable onPress={closeCenter} hitSlop={8}>
          <Ionicons name="close" size={20} color={t.textSecondary} />
        </Pressable>
      </View>

      {isLoading ? (
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <ActivityIndicator color={t.accent} />
        </View>
      ) : sections.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Text style={{ fontSize: 40 }}>🔔</Text>
          <Text style={{ fontSize: 16, fontWeight: '700', color: t.text }}>
            Aucune notification
          </Text>
          <Text style={{ fontSize: 14, color: t.textSecondary }}>
            Vous serez notifié en temps réel
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <NotificationItem item={item} onPress={handlePress} />
          )}
          renderSectionHeader={({ section }) => (
            <View
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                backgroundColor: t.bg,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: t.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                }}
              >
                {section.title}
              </Text>
            </View>
          )}
          ItemSeparatorComponent={() => (
            <View
              style={{
                height: 1,
                backgroundColor: t.separator,
                marginLeft: 68,
              }}
            />
          )}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
});

NotificationCenterScreen.displayName = 'NotificationCenterScreen';
