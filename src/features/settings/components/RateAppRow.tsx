import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import {
  AppIcon,
  type AppIconName,
  type AppIconTone,
} from '@/shared/ui/icons/AppIcon';
import { useStoreReview } from '../hooks/useStoreReview';

export function RateAppRow({ isLast = false }: { isLast?: boolean }) {
  const theme = useTheme();
  const { t } = useTranslation('common');
  const { reviewState, request } = useStoreReview();

  const isDone = reviewState === 'done';
  const isBlocked = reviewState === 'blocked';
  const isBusy = reviewState === 'requesting';

  const icon: { name: AppIconName; tone: AppIconTone } = isDone
    ? { name: 'check', tone: 'green' }
    : isBlocked
      ? { name: 'clock', tone: 'amber' }
      : { name: 'star', tone: 'amber' };

  const label = isDone
    ? t('rate_thanks')
    : isBlocked
      ? t('rate_already')
      : t('rate_cta');

  const subtitle = isDone
    ? t('rate_thanks_subtitle')
    : isBlocked
      ? t('rate_already_subtitle')
      : t('rate_subtitle');

  const handlePress = () => {
    if (isBusy || isDone || isBlocked) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    request();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={isBusy || isDone || isBlocked ? 1 : 0.7}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 13,
        paddingHorizontal: 16,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: theme.separator,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        {isBusy ? (
          <ActivityIndicator size="small" color={theme.amber} />
        ) : (
          <AppIcon name={icon.name} tone={icon.tone} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.text, fontSize: 15, fontWeight: '600' }}>
          {label}
        </Text>
        <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 1 }}>
          {subtitle}
        </Text>
      </View>
      {!isDone && !isBlocked && !isBusy && (
        <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
      )}
    </TouchableOpacity>
  );
}
