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
import { useTranslation } from 'react-i18next';
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
  const { t: i18n } = useTranslation('notifications');
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
      {/* Handle bar */}
      <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
        <View
          style={{
            width: 40,
            height: 4,
            borderRadius: 2,
            backgroundColor: t.inputBorder,
          }}
        />
      </View>

      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 16,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 22,
              fontWeight: '800',
              color: t.text,
              letterSpacing: -0.4,
            }}
          >
            {i18n('title')}
          </Text>
          {unread > 0 && (
            <Text style={{ fontSize: 13, color: t.textMuted, marginTop: 2 }}>
              {i18n('unread_other', { count: unread })}
            </Text>
          )}
        </View>

        {unread > 0 && (
          <Pressable
            onPress={handleMarkAllRead}
            hitSlop={8}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              backgroundColor: t.accentBg,
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 7,
              marginRight: 10,
            }}
          >
            <Ionicons
              name="checkmark-done-outline"
              size={14}
              color={t.accent}
            />
            <Text style={{ fontSize: 13, color: t.accent, fontWeight: '700' }}>
              {i18n('mark_all_read_short')}
            </Text>
          </Pressable>
        )}

        <Pressable
          onPress={closeCenter}
          hitSlop={8}
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            backgroundColor: t.iconBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="close" size={18} color={t.textSecondary} />
        </Pressable>
      </View>

      {/* Divider */}
      <View
        style={{
          height: 1,
          backgroundColor: t.cardBorder,
          marginHorizontal: 20,
          marginBottom: 4,
        }}
      />

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
            gap: 10,
            paddingBottom: 60,
          }}
        >
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 22,
              backgroundColor: t.iconBg,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 4,
            }}
          >
            <Ionicons
              name="notifications-outline"
              size={32}
              color={t.textMuted}
            />
          </View>
          <Text style={{ fontSize: 17, fontWeight: '700', color: t.text }}>
            {i18n('empty')}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: t.textSecondary,
              textAlign: 'center',
              paddingHorizontal: 40,
              lineHeight: 20,
            }}
          >
            {i18n('empty_body')}
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
                paddingHorizontal: 20,
                paddingTop: 16,
                paddingBottom: 6,
                backgroundColor: t.bg,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: t.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: 0.9,
                }}
              >
                {section.title}
              </Text>
            </View>
          )}
          contentContainerStyle={{
            paddingBottom: insets.bottom + 32,
            paddingTop: 4,
          }}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      )}
    </View>
  );
});

NotificationCenterScreen.displayName = 'NotificationCenterScreen';
