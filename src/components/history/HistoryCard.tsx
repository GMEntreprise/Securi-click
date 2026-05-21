import React, { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import type { HistoryEntry } from '@/features/parent/services/history.service';

interface Props {
  item: HistoryEntry;
  index: number;
  onPress: (entry: HistoryEntry) => void;
}

const STATUS_CFG = {
  completed: {
    iconName: 'checkmark-circle' as const,
    color: '#10b981',
    bg: 'rgba(16,185,129,0.12)',
    label: 'Validé',
  },
  denied: {
    iconName: 'close-circle' as const,
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.12)',
    label: 'Refusé',
  },
  cancelled: {
    iconName: 'remove-circle' as const,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
    label: 'Annulé',
  },
} as const;

export const HistoryCard = memo(function HistoryCard({
  item,
  index,
  onPress,
}: Props) {
  const theme = useTheme();
  const cfg = STATUS_CFG[item.status] ?? STATUS_CFG.cancelled;
  const { iconName } = cfg;

  const childName = item.child
    ? `${item.child.first_name} ${item.child.last_name}`
    : '—';
  const guardianName = item.guardian
    ? `${item.guardian.first_name} ${item.guardian.last_name}`
    : 'Inconnu';
  const d = new Date(item.scanned_at);
  const time = d.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(item);
  }, [item, onPress]);

  return (
    <Animated.View entering={FadeInDown.delay(index * 40).duration(320)}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.85}
        style={{
          backgroundColor: theme.card,
          borderRadius: 18,
          marginBottom: 8,
          borderWidth: 1,
          borderColor: theme.cardBorder,
          overflow: 'hidden',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'stretch' }}>
          <View style={{ width: 3, backgroundColor: cfg.color }} />
          <View style={{ flex: 1, padding: 13 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 6,
              }}
            >
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
              >
                <View
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 9,
                    backgroundColor: cfg.bg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name={iconName} size={15} color={cfg.color} />
                </View>
                <Text
                  style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}
                >
                  {childName}
                </Text>
                {item.is_pinned ? (
                  <Ionicons name="pin" size={12} color={theme.accent} />
                ) : null}
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <View
                  style={{
                    backgroundColor: cfg.bg,
                    paddingHorizontal: 7,
                    paddingVertical: 2,
                    borderRadius: 8,
                  }}
                >
                  <Text
                    style={{
                      color: cfg.color,
                      fontSize: 11,
                      fontWeight: '700',
                    }}
                  >
                    {cfg.label}
                  </Text>
                </View>
                <Text style={{ color: theme.textMuted, fontSize: 12 }}>
                  {time}
                </Text>
              </View>
            </View>

            <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
              Par{' '}
              <Text style={{ fontWeight: '600', color: theme.text }}>
                {guardianName}
              </Text>
              {item.guardian?.relationship
                ? ` · ${item.guardian.relationship}`
                : ''}
            </Text>

            {item.denial_reason ? (
              <Text
                style={{
                  color: theme.red,
                  fontSize: 12,
                  marginTop: 4,
                  fontStyle: 'italic',
                }}
                numberOfLines={1}
              >
                {item.denial_reason}
              </Text>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});
