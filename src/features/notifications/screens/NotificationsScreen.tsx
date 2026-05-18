import React, { memo, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SectionList,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, CheckCheck } from 'lucide-react-native';
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
import { NOTIFICATION_ROUTES } from '../utils/constants';
import type { Notification } from '../types';

export const NotificationsScreen = memo(() => {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const unread = useUnreadCount();
  const { enabled, setEnabled } = useNotificationPref();

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
      if (!item.is_read) markRead.mutate([item.id]);
      const route = item.metadata?.route ?? NOTIFICATION_ROUTES[item.type];
      if (route) router.push(route as any);
    },
    [markRead, router]
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: t.card,
          borderBottomWidth: 1,
          borderBottomColor: t.cardBorder,
          paddingTop: insets.top + 16,
          paddingBottom: 16,
          paddingHorizontal: 20,
          gap: 14,
        }}
      >
        {/* Row 1 : back + titre + toggle */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              backgroundColor: t.iconBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowLeft size={20} color={t.text} strokeWidth={2} />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: t.textMuted,
                fontSize: 11,
                fontWeight: '700',
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                marginBottom: 2,
              }}
            >
              Centre de
            </Text>
            <Text style={{ color: t.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.3 }}>
              Notifications
            </Text>
          </View>

          {/* Toggle activé/désactivé — bien visible dans le header */}
          <View style={{ alignItems: 'flex-end', gap: 2 }}>
            <Switch
              value={enabled}
              onValueChange={setEnabled}
              trackColor={{ false: t.inputBorder, true: t.accent }}
              thumbColor="#fff"
              ios_backgroundColor={t.inputBorder}
            />
            <Text style={{ fontSize: 10, fontWeight: '600', color: enabled ? t.accent : t.textMuted }}>
              {enabled ? 'Activées' : 'Désactivées'}
            </Text>
          </View>
        </View>

        {/* Row 2 : "Tout lire" — visible seulement si non-lues */}
        {unread > 0 && (
          <Pressable
            onPress={() => markAllRead.mutate()}
            hitSlop={8}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              alignSelf: 'flex-end',
            }}
          >
            <CheckCheck size={14} color={t.accent} strokeWidth={2} />
            <Text style={{ fontSize: 13, color: t.accent, fontWeight: '600' }}>
              Tout marquer comme lu
            </Text>
          </Pressable>
        )}
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={t.accent} />
        </View>
      ) : sections.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <Text style={{ fontSize: 48 }}>🔔</Text>
          <Text style={{ fontSize: 17, fontWeight: '700', color: t.text }}>
            Aucune notification
          </Text>
          <Text style={{ fontSize: 14, color: t.textSecondary, textAlign: 'center', paddingHorizontal: 40 }}>
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
            <View style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: t.bg }}>
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
            <View style={{ height: 1, backgroundColor: t.separator, marginLeft: 68 }} />
          )}
          contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
});

NotificationsScreen.displayName = 'NotificationsScreen';
