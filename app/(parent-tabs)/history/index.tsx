import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  useColorScheme,
} from 'react-native';
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

const mockHistory = [
  {
    id: '1',
    childName: 'Emma',
    collectorName: 'Jean Dupont',
    time: '14:30',
    date: '2025-01-15',
    location: 'École Saint-Exupéry',
    status: 'completed',
    type: 'pickup',
  },
  {
    id: '2',
    childName: 'Lucas',
    collectorName: 'Marie Martin',
    time: '09:15',
    date: '2025-01-15',
    location: 'Portail principal',
    status: 'pending',
    type: 'authorization',
  },
  {
    id: '3',
    childName: 'Emma',
    collectorName: 'Jean Dupont',
    time: '16:45',
    date: '2025-01-14',
    location: 'École Saint-Exupéry',
    status: 'completed',
    type: 'pickup',
  },
  {
    id: '4',
    childName: 'Lucas',
    collectorName: 'Inconnu',
    time: '12:00',
    date: '2025-01-14',
    location: 'Portail secondaire',
    status: 'failed',
    type: 'pickup',
  },
];

type FilterId = 'all' | 'completed' | 'pending' | 'failed';

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all', label: 'Tout' },
  { id: 'completed', label: 'Succès' },
  { id: 'pending', label: 'Attente' },
  { id: 'failed', label: 'Échecs' },
];

function useTheme() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  return {
    dark,
    bg: dark ? '#0d1117' : '#f9f5f0',
    card: dark ? '#161b22' : '#ffffff',
    cardBorder: dark ? '#21262d' : '#f0ede8',
    header: dark ? '#111111' : '#ffffff',
    headerBorder: dark ? '#21262d' : '#f0ede8',
    filterBg: dark ? '#161b22' : '#ffffff',
    filterBorder: dark ? '#21262d' : '#f0ede8',
    filterActiveBg: dark ? '#1e3a8a' : '#f97316',
    text: dark ? '#f9fafb' : '#111827',
    textSecondary: dark ? '#9ca3af' : '#6b7280',
    textMuted: dark ? '#6b7280' : '#9ca3af',
    accent: dark ? '#3b82f6' : '#f97316',
  };
}

const STATUS_CONFIG = {
  completed: {
    color: '#10b981',
    bg: 'rgba(16,185,129,0.12)',
    label: 'Succès',
    Icon: CheckCircle,
  },
  pending: {
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
    label: 'Attente',
    Icon: Clock,
  },
  failed: {
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.12)',
    label: 'Échec',
    Icon: AlertCircle,
  },
};

function HistoryItem({
  item,
  index,
}: {
  item: (typeof mockHistory)[0];
  index: number;
}) {
  const theme = useTheme();
  const cfg =
    STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG] ??
    STATUS_CONFIG.pending;
  const { Icon } = cfg;

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
                {item.childName}
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
            {item.type === 'pickup' ? 'Récupéré par' : 'Autorisation pour'}{' '}
            <Text style={{ fontWeight: '600', color: theme.text }}>
              {item.collectorName}
            </Text>
          </Text>

          <View style={{ flexDirection: 'row', gap: 14 }}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Calendar size={12} color={theme.textMuted} />
              <Text style={{ color: theme.textMuted, fontSize: 12 }}>
                {new Date(item.date).toLocaleDateString('fr-FR')} · {item.time}
              </Text>
            </View>
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
                {item.location}
              </Text>
            </View>
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

  const stats = useMemo(
    () => ({
      completed: mockHistory.filter(i => i.status === 'completed').length,
      pending: mockHistory.filter(i => i.status === 'pending').length,
      failed: mockHistory.filter(i => i.status === 'failed').length,
    }),
    []
  );

  const filtered = useMemo(
    () =>
      filter === 'all'
        ? mockHistory
        : mockHistory.filter(i => i.status === filter),
    [filter]
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
          backgroundColor: theme.header,
          borderBottomWidth: 1,
          borderBottomColor: theme.headerBorder,
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
              value: stats.pending,
              label: 'Attente',
              color: '#f59e0b',
              bg: 'rgba(245,158,11,0.1)',
            },
            {
              value: stats.failed,
              label: 'Échecs',
              color: '#ef4444',
              bg: 'rgba(239,68,68,0.1)',
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
                {s.value}
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
                  backgroundColor: active
                    ? theme.filterActiveBg
                    : theme.filterBg,
                  borderWidth: 1,
                  borderColor: active ? 'transparent' : theme.filterBorder,
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
              Aucune activité
            </Text>
          </View>
        )}
      />
    </View>
  );
}
