import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { useTheme } from '@/theme';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  MapPin,
  Calendar,
} from 'lucide-react-native';
import { usePickupLogs } from '@/features/parent/hooks/usePickupLogs';
import type { PickupLog } from '@/features/parent/types';

type FilterId = 'all' | 'completed' | 'denied' | 'cancelled';

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all', label: 'Tout' },
  { id: 'completed', label: 'Succès' },
  { id: 'denied', label: 'Refusés' },
  { id: 'cancelled', label: 'Annulés' },
];

const STATUS_CONFIG = {
  completed: {
    color: '#10b981',
    bg: 'rgba(16,185,129,0.12)',
    label: 'Succès',
    Icon: CheckCircle,
  },
  denied: {
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.12)',
    label: 'Refusé',
    Icon: AlertCircle,
  },
  cancelled: {
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
    label: 'Annulé',
    Icon: Clock,
  },
};

function HistoryItem({ item, index }: { item: PickupLog; index: number }) {
  const theme = useTheme();
  const cfg =
    STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG] ??
    STATUS_CONFIG.cancelled;
  const { Icon } = cfg;

  const childName = item.child
    ? `${item.child.first_name} ${item.child.last_name}`
    : '—';
  const guardianName = item.guardian
    ? `${item.guardian.first_name} ${item.guardian.last_name}`
    : 'Inconnu';
  const pickupDate = new Date(item.pickup_time);
  const dateStr = pickupDate.toLocaleDateString('fr-FR');
  const timeStr = pickupDate.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).duration(350)}
      style={{
        backgroundColor: theme.card,
        borderRadius: 20,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: theme.cardBorder,
        overflow: 'hidden',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'stretch' }}>
        <View style={{ width: 4, backgroundColor: cfg.color }} />
        <View style={{ flex: 1, padding: 14 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  backgroundColor: cfg.bg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={16} color={cfg.color} strokeWidth={2.5} />
              </View>
              <Text
                style={{ color: theme.text, fontWeight: '700', fontSize: 15 }}
              >
                {childName}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: cfg.bg,
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 10,
              }}
            >
              <Text
                style={{ color: cfg.color, fontSize: 11, fontWeight: '700' }}
              >
                {cfg.label}
              </Text>
            </View>
          </View>

          <Text
            style={{
              color: theme.textSecondary,
              fontSize: 13,
              marginBottom: 6,
            }}
          >
            Récupéré par{' '}
            <Text style={{ fontWeight: '600', color: theme.text }}>
              {guardianName}
            </Text>
          </Text>

          <View style={{ flexDirection: 'row', gap: 14 }}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Calendar size={12} color={theme.textMuted} />
              <Text style={{ color: theme.textMuted, fontSize: 12 }}>
                {dateStr} · {timeStr}
              </Text>
            </View>
            {item.denial_reason ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  flex: 1,
                }}
              >
                <MapPin size={12} color={theme.textMuted} />
                <Text
                  style={{ color: theme.textMuted, fontSize: 12 }}
                  numberOfLines={1}
                >
                  {item.denial_reason}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [filter, setFilter] = useState<FilterId>('all');
  const { data: logs, isLoading } = usePickupLogs(100);

  const stats = useMemo(
    () => ({
      completed: (logs ?? []).filter(l => l.status === 'completed').length,
      denied: (logs ?? []).filter(l => l.status === 'denied').length,
      cancelled: (logs ?? []).filter(l => l.status === 'cancelled').length,
    }),
    [logs]
  );

  const filtered = useMemo(
    () =>
      filter === 'all'
        ? (logs ?? [])
        : (logs ?? []).filter(l => l.status === filter),
    [filter, logs]
  );

  const handleFilter = useCallback((id: FilterId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFilter(id);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* Header */}
      <Animated.View
        entering={FadeInDown.duration(400)}
        style={{
          backgroundColor: theme.card,
          borderBottomWidth: 1,
          borderBottomColor: theme.cardBorder,
          paddingTop: insets.top + 16,
          paddingBottom: 16,
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
            marginBottom: 4,
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
            marginBottom: 16,
          }}
        >
          Historique
        </Text>

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
          {[
            {
              value: stats.completed,
              label: 'Succès',
              color: '#10b981',
              bg: 'rgba(16,185,129,0.1)',
            },
            {
              value: stats.denied,
              label: 'Refusés',
              color: '#ef4444',
              bg: 'rgba(239,68,68,0.1)',
            },
            {
              value: stats.cancelled,
              label: 'Annulés',
              color: '#f59e0b',
              bg: 'rgba(245,158,11,0.1)',
            },
          ].map(s => (
            <View
              key={s.label}
              style={{
                flex: 1,
                backgroundColor: s.bg,
                borderRadius: 14,
                padding: 10,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: s.color, fontSize: 20, fontWeight: '800' }}>
                {isLoading ? '—' : s.value}
              </Text>
              <Text
                style={{
                  color: s.color,
                  fontSize: 11,
                  fontWeight: '600',
                  marginTop: 1,
                }}
              >
                {s.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Filters */}
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {FILTERS.map(f => {
            const active = filter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                onPress={() => handleFilter(f.id)}
                style={{
                  flex: 1,
                  paddingVertical: 7,
                  borderRadius: 12,
                  alignItems: 'center',
                  backgroundColor: active ? theme.accent : theme.card,
                  borderWidth: 1,
                  borderColor: active ? 'transparent' : theme.cardBorder,
                }}
              >
                <Text
                  style={{
                    color: active ? '#fff' : theme.textSecondary,
                    fontSize: 12,
                    fontWeight: '700',
                  }}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        renderItem={({ item, index }) => (
          <HistoryItem item={item} index={index} />
        )}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={{ alignItems: 'center', paddingTop: 60, gap: 12 }}>
            <Clock size={40} color={theme.textMuted} strokeWidth={1.5} />
            <Text style={{ color: theme.textMuted, fontSize: 15 }}>
              {isLoading ? 'Chargement…' : 'Aucune activité'}
            </Text>
          </View>
        )}
      />
    </View>
  );
}
