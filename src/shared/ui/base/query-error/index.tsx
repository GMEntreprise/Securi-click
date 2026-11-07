import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';

interface Props {
  onRetry?: () => void;
  message?: string;
}

export function QueryError({ onRetry, message }: Props) {
  const theme = useTheme();
  const { t } = useTranslation('common');

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        gap: 16,
      }}
    >
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 20,
          backgroundColor: theme.redBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="wifi-outline" size={28} color={theme.red} />
      </View>
      <View style={{ alignItems: 'center', gap: 6 }}>
        <Text
          style={{
            color: theme.text,
            fontSize: 17,
            fontWeight: '700',
            textAlign: 'center',
          }}
        >
          {t('load_error_title')}
        </Text>
        <Text
          style={{
            color: theme.textMuted,
            fontSize: 14,
            textAlign: 'center',
            lineHeight: 20,
          }}
        >
          {message ?? t('load_error_message')}
        </Text>
      </View>
      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          style={{
            backgroundColor: theme.accent,
            borderRadius: 14,
            paddingVertical: 12,
            paddingHorizontal: 24,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
            {t('retry')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
