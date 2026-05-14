import React, { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Bell } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { useUnreadCount } from '../stores/notification.store';
import { useNotificationStore } from '../stores/notification.store';

interface Props {
  size?: number;
}

export const NotificationBell = memo(({ size = 22 }: Props) => {
  const t = useTheme();
  const unread = useUnreadCount();
  const openCenter = useNotificationStore(s => s.openCenter);

  return (
    <Pressable
      onPress={openCenter}
      hitSlop={8}
      style={{ padding: 4 }}
    >
      <View style={{ position: 'relative' }}>
        <Bell size={size} color={t.textSecondary} strokeWidth={1.8} />
        {unread > 0 && (
          <View
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              minWidth: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: t.red,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 3,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>
              {unread > 99 ? '99+' : unread}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
});

NotificationBell.displayName = 'NotificationBell';
