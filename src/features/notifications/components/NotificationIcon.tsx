import React, { memo } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import type { NotificationType } from '../types';

const ICON_MAP: Record<
  NotificationType,
  React.ComponentProps<typeof Ionicons>['name']
> = {
  child_picked_up: 'checkmark-circle',
  pickup_refused: 'close-circle',
  qr_expired: 'time-outline',
  qr_invalid: 'warning-outline',
  qr_used: 'qr-code-outline',
  collector_activated: 'person-circle-outline',
  collector_deactivated: 'person-remove-outline',
  new_authorization: 'shield-checkmark',
  identity_validated: 'badge-outline' as any,
  identity_refused: 'close-circle',
  account_created: 'person-add-outline',
  permissions_modified: 'settings-outline',
  security_incident: 'warning-outline',
  new_parent_linked: 'link-outline',
  school_validated: 'school-outline',
  access_suspended: 'pause-circle-outline',
};

const COLOR_MAP: Record<NotificationType, keyof ReturnType<typeof useTheme>> = {
  child_picked_up: 'green',
  pickup_refused: 'red',
  qr_expired: 'amber',
  qr_invalid: 'red',
  qr_used: 'accent',
  collector_activated: 'green',
  collector_deactivated: 'red',
  new_authorization: 'accent',
  identity_validated: 'green',
  identity_refused: 'red',
  account_created: 'green',
  permissions_modified: 'amber',
  security_incident: 'red',
  new_parent_linked: 'accent',
  school_validated: 'green',
  access_suspended: 'amber',
};

interface Props {
  type: NotificationType;
  size?: number;
}

export const NotificationIcon = memo(({ type, size = 18 }: Props) => {
  const t = useTheme();
  const iconName = ICON_MAP[type] ?? 'shield-checkmark';
  const colorKey = COLOR_MAP[type] ?? 'accent';
  const color = t[colorKey] as string;
  const bg = `${color}1a`;

  return (
    <View
      style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={iconName} size={size} color={color} />
    </View>
  );
});

NotificationIcon.displayName = 'NotificationIcon';
