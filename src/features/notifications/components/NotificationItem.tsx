import React, { memo, useCallback } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useTheme } from '@/theme';
import { NotificationIcon } from './NotificationIcon';
import type { Notification } from '../types';

interface Props {
  item: Notification;
  onPress: (item: Notification) => void;
}

export const NotificationItem = memo(({ item, onPress }: Props) => {
  const t = useTheme();

  const handlePress = useCallback(() => onPress(item), [item, onPress]);

  const timeAgo = formatDistanceToNow(new Date(item.created_at), {
    addSuffix: true,
    locale: fr,
  });

  return (
    <Animated.View
      entering={FadeInDown.duration(200)}
      style={{ paddingHorizontal: 16, paddingVertical: 4 }}
    >
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 12,
          paddingHorizontal: 14,
          paddingVertical: 14,
          backgroundColor: item.is_read
            ? t.card
            : t.isDark
              ? 'rgba(249,115,22,0.07)'
              : 'rgba(249,115,22,0.05)',
          borderRadius: 18,
          borderWidth: 1,
          borderColor: item.is_read
            ? t.cardBorder
            : t.isDark
              ? 'rgba(249,115,22,0.18)'
              : 'rgba(249,115,22,0.15)',
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <NotificationIcon type={item.type} />

        <View style={{ flex: 1, gap: 3 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: item.is_read ? '600' : '700',
                color: t.text,
                flex: 1,
              }}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text style={{ fontSize: 11, color: t.textMuted, flexShrink: 0 }}>
              {timeAgo}
            </Text>
          </View>

          <Text
            style={{ fontSize: 13, color: t.textSecondary, lineHeight: 19 }}
            numberOfLines={2}
          >
            {item.body}
          </Text>
        </View>

        {!item.is_read && (
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: t.accent,
              marginTop: 5,
              flexShrink: 0,
            }}
          />
        )}
      </Pressable>
    </Animated.View>
  );
});

NotificationItem.displayName = 'NotificationItem';
