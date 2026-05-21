import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/shared/ui/base/avatar';
import { useTheme } from '@/theme';
import { useMyPickupLogs } from '@/features/collector/hooks/useCollector';
import type { CollectorPickupLog } from '@/features/collector/types';

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

function LogCard({ item, index }: { item: CollectorPickupLog; index: number }) {
  const theme = useTheme();
  const cfg = STATUS_CFG[item.status] ?? STATUS_CFG.cancelled;
  const d = new Date(item.pickup_time);

  return (
    <Animated.View entering={FadeInDown.delay(index * 40).duration(300)}>
      <View
        style={{
          backgroundColor: theme.card,
          borderRadius: 18,
          marginBottom: 8,
          borderWidth: 1,
          borderColor: theme.cardBorder,
          overflow: 'hidden',
          flexDirection: 'row',
          alignItems: 'stretch',
        }}
      >
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
              <Avatar
                image={{
                  uri: item.child?.photo_url ?? '',
                  name: `${item.child?.first_name ?? ''} ${item.child?.last_name ?? ''}`.trim(),
                }}
                size={30}
                showBorder={false}
                backgroundColor={cfg.bg}
                textColor={cfg.color}
              />
              <Text
                style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}
              >
                {item.child?.first_name} {item.child?.last_name}
              </Text>
            </View>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
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
                  style={{ color: cfg.color, fontSize: 11, fontWeight: '700' }}
                >
                  {cfg.label}
                </Text>
              </View>
              <Text style={{ color: theme.textMuted, fontSize: 12 }}>
                {d.toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </View>
          <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
            {d.toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </Text>
          {item.denial_reason ? (
            <Text
              style={{
                color: '#ef4444',
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
    </Animated.View>
  );
}

export default function CollectorHistoryScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { data: logs, isLoading, refetch, isRefetching } = useMyPickupLogs();

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <Animated.View
        entering={FadeInDown.duration(400)}
        style={{
          backgroundColor: theme.card,
          borderBottomWidth: 1,
          borderBottomColor: theme.cardBorder,
          paddingTop: insets.top + 16,
          paddingBottom: 14,
          paddingHorizontal: 20,
        }}
      >
        <Text
          style={{
            color: theme.textMuted,
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            marginBottom: 2,
          }}
        >
          Activité
        </Text>
        <Text
          style={{
            color: theme.text,
            fontSize: 26,
            fontWeight: '800',
            letterSpacing: -0.5,
          }}
        >
          Historique
        </Text>
      </Animated.View>

      <FlashList
        data={logs ?? []}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => <LogCard item={item} index={index} />}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListEmptyComponent={() => (
          <View style={{ alignItems: 'center', paddingTop: 60, gap: 12 }}>
            {isLoading ? (
              <ActivityIndicator color={theme.accent} />
            ) : (
              <>
                <Ionicons
                  name="time-outline"
                  size={44}
                  color={theme.textMuted}
                />
                <Text
                  style={{
                    color: theme.textMuted,
                    fontSize: 15,
                    fontWeight: '600',
                  }}
                >
                  Aucune récupération enregistrée.
                </Text>
              </>
            )}
          </View>
        )}
      />
    </View>
  );
}
