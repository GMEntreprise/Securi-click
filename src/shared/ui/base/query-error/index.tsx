import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';

interface Props {
  onRetry?: () => void;
  message?: string;
}

export function QueryError({
  onRetry,
  message = 'Impossible de charger les données.',
}: Props) {
  const theme = useTheme();

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
          Erreur de chargement
        </Text>
        <Text
          style={{
            color: theme.textMuted,
            fontSize: 14,
            textAlign: 'center',
            lineHeight: 20,
          }}
        >
          {message}
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
            Réessayer
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
