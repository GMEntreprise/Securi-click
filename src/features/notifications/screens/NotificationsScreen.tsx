import React, { memo, useCallback, useLayoutEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SectionList,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { NotificationItem } from '../components/NotificationItem';
import {
  useNotificationsList,
  useMarkRead,
  useMarkAllRead,
  useNotificationsRealtime,
} from '../hooks/useNotifications';
import { useNotificationPref } from '../hooks/useNotificationPref';
import { useUnreadCount } from '../stores/notification.store';
import { groupNotificationsByDate } from '../utils/groupByDate';
import type { Notification } from '../types';

export const NotificationsScreen = memo(() => {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const unread = useUnreadCount();
  const { enabled, setEnabled } = useNotificationPref();

  const { data: notifications, isLoading } = useNotificationsList();
  useNotificationsRealtime();

  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerBackTitle: '',
      headerRight: () => (
        <Switch
          value={enabled}
          onValueChange={setEnabled}
          trackColor={{ false: t.inputBorder, true: t.accent }}
          thumbColor="#fff"
          ios_backgroundColor={t.inputBorder}
          style={{ marginRight: 4 }}
        />
      ),
    });
  }, [navigation, enabled, setEnabled, t]);

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
      if (!item.is_read) markRead.mutate([item.id]);
    },
    [markRead]
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      {unread > 0 && (
        <View
          style={{
            backgroundColor: t.card,
            borderBottomWidth: 1,
            borderBottomColor: t.cardBorder,
            paddingVertical: 8,
            paddingHorizontal: 16,
            alignItems: 'flex-end',
          }}
        >
          <Pressable
            onPress={() => markAllRead.mutate()}
            hitSlop={8}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
          >
            <Ionicons
              name="checkmark-done-outline"
              size={14}
              color={t.accent}
            />
            <Text style={{ fontSize: 13, color: t.accent, fontWeight: '600' }}>
              Tout marquer comme lu
            </Text>
          </Pressable>
        </View>
      )}

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
          }}
        >
          <Text style={{ fontSize: 48 }}>🔔</Text>
          <Text style={{ fontSize: 17, fontWeight: '700', color: t.text }}>
            Aucune notification
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: t.textSecondary,
              textAlign: 'center',
              paddingHorizontal: 40,
            }}
          >
            Vous serez notifié en temps réel des événements importants.
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
          contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
});

NotificationsScreen.displayName = 'NotificationsScreen';
