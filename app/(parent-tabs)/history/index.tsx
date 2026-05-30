import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppNavigation } from '@/navigation/useAppNavigation';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import {
  useHistoryFeed,
  useMonthlyCounts,
  FlatListItem,
  SectionItem,
  RowItem,
  HistoryFilters,
} from '@/features/parent/hooks/useHistory';
import { HistoryCard } from '@/components/history/HistoryCard';
import { FiltersBar } from '@/components/history/FiltersBar';
import { HistoryDetailsBottomSheet } from '@/components/bottom-sheets/HistoryDetailsBottomSheet';
import { HistoryEntry } from '@/features/parent/services/history.service';
import { QueryError } from '@/shared/ui/base/query-error';
import { useTranslation } from 'react-i18next';

const EMPTY_FILTERS: HistoryFilters = {
  status: null,
  year: null,
  month: null,
  dateFrom: null,
  dateTo: null,
};

function SectionHeader({ item }: { item: SectionItem }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 6,
        paddingHorizontal: 4,
        marginBottom: 4,
        marginTop: 8,
      }}
    >
      <Text
        style={{
          color: theme.textMuted,
          fontSize: 12,
          fontWeight: '700',
          textTransform: 'capitalize',
        }}
      >
        {item.label}
      </Text>
      <View
        style={{
          backgroundColor: theme.iconBg,
          borderRadius: 8,
          paddingHorizontal: 7,
          paddingVertical: 2,
        }}
      >
        <Text
          style={{ color: theme.textMuted, fontSize: 11, fontWeight: '600' }}
        >
          {item.count}
        </Text>
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const nav = useAppNavigation();
  const { t: i18n } = useTranslation('parent');

  const [filters, setFilters] = useState<HistoryFilters>(EMPTY_FILTERS);
  const [search, setSearch] = useState('');
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const activeFilters: HistoryFilters = useMemo(
    () => ({ ...filters, search: debouncedSearch || undefined }),
    [filters, debouncedSearch]
  );

  const {
    flatItems,
    total,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useHistoryFeed(activeFilters);

  const { data: monthlyCounts } = useMonthlyCounts();

  const availableYears = useMemo(
    () =>
      monthlyCounts
        ? [...new Set(monthlyCounts.map(c => c.year))].sort((a, b) => b - a)
        : [],
    [monthlyCounts]
  );

  const handleSearchChange = useCallback((v: string) => {
    setSearch(v);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => setDebouncedSearch(v), 350);
  }, []);

  const handleCardPress = useCallback((entry: HistoryEntry) => {
    setSelectedId(entry.id);
  }, []);

  const handleCloseSheet = useCallback(() => setSelectedId(null), []);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item, index }: { item: FlatListItem; index: number }) => {
      if (item.type === 'header') {
        return <SectionHeader item={item as SectionItem} />;
      }
      const row = item as RowItem;
      return (
        <HistoryCard item={row.data} index={index} onPress={handleCardPress} />
      );
    },
    [handleCardPress]
  );

  const keyExtractor = useCallback((item: FlatListItem) => item.key, []);

  const getItemType = useCallback(
    (item: FlatListItem, _index: number) => item.type,
    []
  );

  if (isError) return <QueryError onRetry={refetch} />;

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
          paddingBottom: 14,
          paddingHorizontal: 20,
          gap: 14,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View>
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
              {i18n('history_activity_label')}
            </Text>
            <Text
              style={{
                color: theme.text,
                fontSize: 26,
                fontWeight: '800',
                letterSpacing: -0.5,
              }}
            >
              {i18n('history_title')}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            {!isLoading && (
              <View
                style={{
                  backgroundColor: theme.accentBg,
                  borderRadius: 10,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                }}
              >
                <Text
                  style={{
                    color: theme.accent,
                    fontSize: 13,
                    fontWeight: '700',
                  }}
                >
                  {total}
                </Text>
              </View>
            )}
            <TouchableOpacity
              onPress={() => nav.goToParentHistoryArchive()}
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: theme.iconBg,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: theme.cardBorder,
              }}
            >
              <Ionicons
                name="archive-outline"
                size={17}
                color={theme.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>

        <FiltersBar
          filters={filters}
          availableYears={availableYears}
          onFiltersChange={setFilters}
          searchValue={search}
          onSearchChange={handleSearchChange}
        />
      </Animated.View>

      <FlashList
        data={flatItems}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemType={getItemType}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={theme.accent}
          />
        }
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
                    textAlign: 'center',
                  }}
                >
                  {i18n('history_empty')}
                </Text>
              </>
            )}
          </View>
        )}
        ListFooterComponent={() =>
          isFetchingNextPage ? (
            <ActivityIndicator
              color={theme.accent}
              style={{ paddingVertical: 20 }}
            />
          ) : null
        }
      />

      <HistoryDetailsBottomSheet
        entryId={selectedId}
        onClose={handleCloseSheet}
      />
    </View>
  );
}
