import React, { memo, useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import type {
  HistoryFilters,
  HistoryStatus,
} from '@/features/parent/services/history.service';

interface Props {
  filters: HistoryFilters;
  availableYears: number[];
  onFiltersChange: (f: HistoryFilters) => void;
  searchValue: string;
  onSearchChange: (v: string) => void;
}

const STATUS_CHIPS: { id: HistoryStatus | null; labelKey: string }[] = [
  { id: null, labelKey: 'status_all' },
  { id: 'completed', labelKey: 'status_completed' },
  { id: 'denied', labelKey: 'status_denied' },
  { id: 'cancelled', labelKey: 'status_cancelled' },
];

const QUICK_RANGES: { id: string; labelKey: string; days: number | null }[] = [
  { id: 'today', labelKey: 'range_today', days: 0 },
  { id: '7d', labelKey: 'range_7d', days: 7 },
  { id: '30d', labelKey: 'range_30d', days: 30 },
  { id: 'month', labelKey: 'range_month', days: null },
];

const MONTH_INDEXES = Array.from({ length: 12 }, (_, index) => index);

export const FiltersBar = memo(function FiltersBar({
  filters,
  availableYears,
  onFiltersChange,
  searchValue,
  onSearchChange,
}: Props) {
  const theme = useTheme();
  const { t } = useTranslation('common');
  const [showMonths, setShowMonths] = useState(false);

  const setStatus = useCallback(
    (status: HistoryStatus | null) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onFiltersChange({ ...filters, status });
    },
    [filters, onFiltersChange]
  );

  const setYear = useCallback(
    (year: number | null) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onFiltersChange({ ...filters, year, month: null });
      setShowMonths(!!year);
    },
    [filters, onFiltersChange]
  );

  const setMonth = useCallback(
    (month: number | null) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onFiltersChange({ ...filters, month });
    },
    [filters, onFiltersChange]
  );

  const applyQuickRange = useCallback(
    (range: (typeof QUICK_RANGES)[number]) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const now = new Date();
      if (range.id === 'today') {
        const from = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        ).toISOString();
        onFiltersChange({
          ...filters,
          dateFrom: from,
          dateTo: null,
          year: null,
          month: null,
        });
      } else if (range.days) {
        const from = new Date(
          now.getTime() - range.days * 86400000
        ).toISOString();
        onFiltersChange({
          ...filters,
          dateFrom: from,
          dateTo: null,
          year: null,
          month: null,
        });
      } else {
        onFiltersChange({
          ...filters,
          year: now.getFullYear(),
          month: now.getMonth() + 1,
          dateFrom: null,
          dateTo: null,
        });
      }
    },
    [filters, onFiltersChange]
  );

  const clearFilters = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onFiltersChange({
      status: null,
      year: null,
      month: null,
      dateFrom: null,
      dateTo: null,
    });
    onSearchChange('');
    setShowMonths(false);
  }, [onFiltersChange, onSearchChange]);

  const hasActiveFilters =
    !!filters.status || !!filters.year || !!filters.dateFrom || !!searchValue;

  return (
    <View style={{ gap: 10 }}>
      {/* Search */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.input,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: theme.inputBorder,
          paddingHorizontal: 12,
          paddingVertical: 10,
          gap: 8,
        }}
      >
        <Ionicons name="search-outline" size={16} color={theme.textMuted} />
        <TextInput
          value={searchValue}
          onChangeText={onSearchChange}
          placeholder={t('history_search_placeholder')}
          placeholderTextColor={theme.placeholder}
          style={{ flex: 1, color: theme.text, fontSize: 14 }}
          returnKeyType="search"
        />
        {searchValue ? (
          <TouchableOpacity onPress={() => onSearchChange('')}>
            <Ionicons name="close" size={15} color={theme.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Quick ranges */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {QUICK_RANGES.map(r => (
            <TouchableOpacity
              key={r.id}
              onPress={() => applyQuickRange(r)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                backgroundColor: theme.iconBg,
                borderWidth: 1,
                borderColor: theme.cardBorder,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Ionicons
                name="calendar-outline"
                size={12}
                color={theme.textMuted}
              />
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: 12,
                  fontWeight: '600',
                }}
              >
                {t(r.labelKey)}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Year selector */}
          {availableYears.map(y => {
            const active = filters.year === y;
            return (
              <TouchableOpacity
                key={y}
                onPress={() => setYear(active ? null : y)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                  backgroundColor: active ? theme.accent : theme.card,
                  borderWidth: 1,
                  borderColor: active ? 'transparent' : theme.cardBorder,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Text
                  style={{
                    color: active ? '#fff' : theme.textSecondary,
                    fontSize: 12,
                    fontWeight: '700',
                  }}
                >
                  {y}
                </Text>
                {availableYears.length > 1 && (
                  <Ionicons
                    name="chevron-down"
                    size={11}
                    color={active ? '#fff' : theme.textMuted}
                  />
                )}
              </TouchableOpacity>
            );
          })}

          {hasActiveFilters && (
            <TouchableOpacity
              onPress={clearFilters}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                backgroundColor: theme.redBg,
                borderWidth: 1,
                borderColor: 'transparent',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Ionicons name="close" size={12} color={theme.red} />
              <Text
                style={{ color: theme.red, fontSize: 12, fontWeight: '600' }}
              >
                {t('clear')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Month chips — shown when year selected */}
      {showMonths && filters.year ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {MONTH_INDEXES.map(i => {
              const monthNum = i + 1;
              const active = filters.month === monthNum;
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => setMonth(active ? null : monthNum)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 20,
                    backgroundColor: active ? theme.primary : theme.card,
                    borderWidth: 1,
                    borderColor: active ? 'transparent' : theme.cardBorder,
                  }}
                >
                  <Text
                    style={{
                      color: active ? '#fff' : theme.textSecondary,
                      fontSize: 12,
                      fontWeight: '600',
                    }}
                  >
                    {t(`month_short_${i}`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      ) : null}

      {/* Status chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {STATUS_CHIPS.map(s => {
            const active = filters.status === s.id;
            return (
              <TouchableOpacity
                key={String(s.id)}
                onPress={() => setStatus(s.id)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: 20,
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
                  {t(s.labelKey)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
});
