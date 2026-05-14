import React, { memo } from 'react';
import { View } from 'react-native';
import {
  CheckCircle, XCircle, Clock, AlertTriangle, UserCheck, UserX,
  Shield, BadgeCheck, UserPlus, Settings, ShieldAlert, Link,
  Building2, PauseCircle, QrCode,
} from 'lucide-react-native';
import { useTheme } from '@/theme';
import type { NotificationType } from '../types';

const ICON_MAP: Record<NotificationType, React.ComponentType<any>> = {
  child_picked_up:       CheckCircle,
  pickup_refused:        XCircle,
  qr_expired:            Clock,
  qr_invalid:            AlertTriangle,
  qr_used:               QrCode,
  collector_activated:   UserCheck,
  collector_deactivated: UserX,
  new_authorization:     Shield,
  identity_validated:    BadgeCheck,
  identity_refused:      XCircle,
  account_created:       UserPlus,
  permissions_modified:  Settings,
  security_incident:     ShieldAlert,
  new_parent_linked:     Link,
  school_validated:      Building2,
  access_suspended:      PauseCircle,
};

const COLOR_MAP: Record<NotificationType, keyof ReturnType<typeof useTheme>> = {
  child_picked_up:       'green',
  pickup_refused:        'red',
  qr_expired:            'amber',
  qr_invalid:            'red',
  qr_used:               'accent',
  collector_activated:   'green',
  collector_deactivated: 'red',
  new_authorization:     'accent',
  identity_validated:    'green',
  identity_refused:      'red',
  account_created:       'green',
  permissions_modified:  'amber',
  security_incident:     'red',
  new_parent_linked:     'accent',
  school_validated:      'green',
  access_suspended:      'amber',
};

interface Props {
  type: NotificationType;
  size?: number;
}

export const NotificationIcon = memo(({ type, size = 18 }: Props) => {
  const t = useTheme();
  const Icon = ICON_MAP[type] ?? Shield;
  const colorKey = COLOR_MAP[type] ?? 'accent';
  const color = t[colorKey] as string;
  const bg = `${color}1a`; // ~10% opacity

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
      <Icon size={size} color={color} strokeWidth={2} />
    </View>
  );
});

NotificationIcon.displayName = 'NotificationIcon';
