import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { useMonthlyCounts } from '@/features/parent/hooks/useHistory';
import {
  useArchiveMonth,
  useRestoreMonth,
} from '@/features/parent/hooks/useArchive';
import { useTranslation } from 'react-i18next';

function getMonthName(year: number, month: number): string {
  return new Date(year, month - 1).toLocaleString(undefined, { month: 'long' });
}

interface MonthRowProps {
  year: number;
  month: number;
  count: number;
  archivedCount: number;
  onArchive: () => void;
  onRestore: () => void;
  isLoading: boolean;
  index: number;
}

function MonthRow({
  year,
  month,
  count,
  archivedCount,
  onArchive,
  onRestore,
  isLoading,
  index,
}: MonthRowProps) {
  const theme = useTheme();
  const { t: i18n } = useTranslation('parent');
  const isArchived = archivedCount > 0 && count === 0;
  const isPartial = archivedCount > 0 && count > 0;

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
      <View
        style={{
          backgroundColor: theme.card,
          borderRadius: 16,
          marginBottom: 8,
          borderWidth: 1,
          borderColor: theme.cardBorder,
          overflow: 'hidden',
        }}
      >
        <View
          style={{ flexDirection: 'row', alignItems: 'center', padding: 14 }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: isArchived ? theme.iconBg : theme.accentBg,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            {isArchived ? (
              <Ionicons
                name="archive-outline"
                size={18}
                color={theme.textMuted}
              />
            ) : (
              <Ionicons name="chevron-forward" size={18} color={theme.accent} />
            )}
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={{ color: theme.text, fontWeight: '700', fontSize: 15 }}
            >
              {getMonthName(year, month)} {year}
            </Text>
            <Text
              style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}
            >
              {isArchived
                ? i18n(
                    archivedCount > 1
                      ? 'archive_entries_archived_other'
                      : 'archive_entries_archived_one',
                    { count: archivedCount }
                  )
                : isPartial
                  ? i18n('archive_entries_partial', {
                      active: count,
                      archived: archivedCount,
                    })
                  : i18n(
                      count > 1
                        ? 'archive_entries_total_other'
                        : 'archive_entries_total_one',
                      { count }
                    )}
            </Text>
          </View>

          {isLoading ? (
            <ActivityIndicator size="small" color={theme.accent} />
          ) : isArchived ? (
            <TouchableOpacity
              onPress={onRestore}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                backgroundColor: theme.accentBg,
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 10,
              }}
            >
              <Ionicons name="archive-outline" size={14} color={theme.accent} />
              <Text
                style={{ color: theme.accent, fontSize: 12, fontWeight: '700' }}
              >
                {i18n('archive_btn_restore')}
              </Text>
            </TouchableOpacity>
          ) : count > 0 ? (
            <TouchableOpacity
              onPress={onArchive}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                backgroundColor: theme.iconBg,
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: theme.cardBorder,
              }}
            >
              <Ionicons
                name="archive-outline"
                size={14}
                color={theme.textMuted}
              />
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: 12,
                  fontWeight: '700',
                }}
              >
                {i18n('archive_btn_archive')}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </Animated.View>
  );
}

export default function ArchiveScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { t: i18n } = useTranslation('parent');
  const { data: monthlyCounts, isLoading } = useMonthlyCounts();

  const grouped = useMemo(() => {
    if (!monthlyCounts) return [];
    const byYear: Record<number, typeof monthlyCounts> = {};
    for (const c of monthlyCounts) {
      if (!byYear[c.year]) byYear[c.year] = [];
      byYear[c.year].push(c);
    }
    return Object.entries(byYear)
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([year, months]) => ({ year: Number(year), months }));
  }, [monthlyCounts]);

  const emptyFilters = useMemo(
    () => ({
      status: null,
      year: null,
      month: null,
      dateFrom: null,
      dateTo: null,
    }),
    []
  );
  const archiveMutation = useArchiveMonth(emptyFilters);
  const restoreMutation = useRestoreMonth(emptyFilters);

  const handleArchive = (year: number, month: number) => {
    Alert.alert(
      i18n('archive_archive_title'),
      i18n('archive_archive_confirm', {
        month: getMonthName(year, month),
        year,
      }),
      [
        { text: i18n('guardian_add_relation_cancel'), style: 'cancel' },
        {
          text: i18n('archive_btn_archive'),
          style: 'destructive',
          onPress: () => archiveMutation.mutate({ year, month }),
        },
      ]
    );
  };

  const handleRestore = (year: number, month: number) => {
    restoreMutation.mutate({ year, month });
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <ActivityIndicator color={theme.accent} style={{ marginTop: 40 }} />
        ) : grouped.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 60, gap: 12 }}>
            <Ionicons
              name="archive-outline"
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
              {i18n('archive_no_archive')}
            </Text>
          </View>
        ) : (
          grouped.map(({ year, months }) => (
            <View key={year}>
              <Text
                style={{
                  color: theme.textMuted,
                  fontSize: 12,
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  marginBottom: 8,
                  marginTop: 4,
                  paddingHorizontal: 4,
                }}
              >
                {year}
              </Text>
              {months.map((m, i) => (
                <MonthRow
                  key={`${m.year}-${m.month}`}
                  year={m.year}
                  month={m.month}
                  count={m.count}
                  archivedCount={m.archived_count}
                  onArchive={() => handleArchive(m.year, m.month)}
                  onRestore={() => handleRestore(m.year, m.month)}
                  isLoading={
                    (archiveMutation.isPending || restoreMutation.isPending) &&
                    archiveMutation.variables?.year === m.year &&
                    archiveMutation.variables?.month === m.month
                  }
                  index={i}
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
