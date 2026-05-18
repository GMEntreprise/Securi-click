import React, { memo, useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@/theme';
import { useUnreadCount, useNotificationStore } from '../stores/notification.store';

interface Props {
  size?: number;
}

export const NotificationBell = memo(({ size = 24 }: Props) => {
  const t = useTheme();
  const unread = useUnreadCount();
  const openCenter = useNotificationStore(s => s.openCenter);

  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);

  // Bounce + shake when unread count increases
  useEffect(() => {
    if (unread === 0) return;
    rotate.value = withSequence(
      withTiming(-15, { duration: 80 }),
      withTiming(15, { duration: 80 }),
      withTiming(-10, { duration: 70 }),
      withTiming(10, { duration: 70 }),
      withTiming(-5, { duration: 60 }),
      withTiming(0, { duration: 60 })
    );
    scale.value = withSequence(
      withSpring(1.25, { damping: 6, stiffness: 300 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );
  }, [unread, rotate, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
  }));

  return (
    <Pressable
      onPress={openCenter}
      hitSlop={10}
      style={{ padding: 6, marginRight: 4 }}
    >
      <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={animatedStyle}>
          <Text style={{ fontSize: size, lineHeight: size + 4 }}>🔔</Text>
        </Animated.View>
        {unread > 0 && (
          <View
            style={{
              position: 'absolute',
              top: -3,
              right: -6,
              minWidth: 17,
              height: 17,
              borderRadius: 9,
              backgroundColor: t.red,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 3,
              borderWidth: 1.5,
              borderColor: t.bg,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800', lineHeight: 12 }}>
              {unread > 99 ? '99+' : unread}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
});

NotificationBell.displayName = 'NotificationBell';
