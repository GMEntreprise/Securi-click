import React, { memo, useCallback } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
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
    <Animated.View entering={FadeIn.duration(200)}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 12,
          paddingHorizontal: 16,
          paddingVertical: 14,
          backgroundColor: item.is_read
            ? t.bg
            : t.isDark
              ? 'rgba(59,130,246,0.05)'
              : 'rgba(249,115,22,0.04)',
          opacity: pressed ? 0.75 : 1,
        })}
      >
        <NotificationIcon type={item.type} />

        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: item.is_read ? '500' : '700',
                color: t.text,
                flex: 1,
                marginRight: 8,
              }}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text style={{ fontSize: 11, color: t.textMuted }}>{timeAgo}</Text>
          </View>

          <Text
            style={{ fontSize: 13, color: t.textSecondary, lineHeight: 18 }}
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
              marginTop: 4,
              flexShrink: 0,
            }}
          />
        )}
      </Pressable>
    </Animated.View>
  );
});

NotificationItem.displayName = 'NotificationItem';
