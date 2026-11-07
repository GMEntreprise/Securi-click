import React from 'react';
import {
  AppIcon,
  type AppIconName,
  type AppIconTone,
} from '@/shared/ui/icons/AppIcon';

const SETTING_ICONS = {
  personalInfo: { name: 'person', tone: 'primary' },
  firstName: { name: 'person', tone: 'primary' },
  lastName: { name: 'person', tone: 'primary' },
  email: { name: 'mail', tone: 'primary' },
  phone: { name: 'phone', tone: 'primary' },
  address: { name: 'pin', tone: 'primary' },
  schoolName: { name: 'building', tone: 'primary' },
  uai: { name: 'key', tone: 'primary' },
  identity: { name: 'idCard', tone: 'primary' },
  security: { name: 'shield', tone: 'accent' },
  darkMode: { name: 'moon', tone: 'neutral' },
  notifications: { name: 'bell', tone: 'green' },
  biometrics: { name: 'fingerprint', tone: 'primary' },
  language: { name: 'globe', tone: 'primary' },
  help: { name: 'help', tone: 'amber' },
  legal: { name: 'document', tone: 'neutral' },
  privacy: { name: 'lock', tone: 'neutral' },
  rate: { name: 'star', tone: 'amber' },
  logout: { name: 'logout', tone: 'red' },
  deleteAccount: { name: 'trash', tone: 'red' },
} satisfies Record<string, { name: AppIconName; tone: AppIconTone }>;

export type SettingId = keyof typeof SETTING_ICONS;

export function SettingIcon({
  id,
  size = 36,
}: {
  id: SettingId;
  size?: number;
}) {
  const { name, tone } = SETTING_ICONS[id];
  return <AppIcon name={name} tone={tone} size={size} />;
}
