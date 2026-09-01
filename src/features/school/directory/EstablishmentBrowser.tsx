import { memo, useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { EstablishmentCard } from './EstablishmentCard';
import { useDebouncedDirectorySearch, useEstablishmentByUai } from './hooks';
import { isValidUaiFormat, normalizeUai } from './normalizeUai';
import {
  canConfirmEstablishment,
  type EstablishmentSelectionPurpose,
} from './selectionPolicy';
import type { EducationEstablishment } from './types';

type Tab = 'search' | 'uai';

interface Props {
  purpose?: EstablishmentSelectionPurpose;
  onSelect: (establishment: EducationEstablishment) => void;
}

export const EstablishmentBrowser = memo(function EstablishmentBrowser({
  purpose = 'claim',
  onSelect,
}: Props) {
  const theme = useTheme();
  const { t } = useTranslation('school');
  const [tab, setTab] = useState<Tab>('search');
  const [query, setQuery] = useState('');
  const [uaiInput, setUaiInput] = useState('');
  const [requestedUai, setRequestedUai] = useState('');

  const search = useDebouncedDirectorySearch(query);
  const lookup = useEstablishmentByUai(requestedUai, requestedUai.length > 0);

  const lookupError = useMemo(() => {
    if (requestedUai && !isValidUaiFormat(requestedUai)) return 'invalid_uai';
    return lookup.data?.status && lookup.data.status !== 'found'
      ? lookup.data.status
      : null;
  }, [lookup.data, requestedUai]);

  const unavailableReason = useCallback(
    (establishment: EducationEstablishment) => {
      if (canConfirmEstablishment(establishment, purpose)) return null;
      if (!establishment.is_active) return null;
      return purpose === 'claim'
        ? t('directory_already_claimed')
        : t('directory_not_on_securiclick');
    },
    [purpose, t]
  );

  const renderItem = useCallback(
    ({ item }: { item: EducationEstablishment }) => (
      <View style={styles.itemSpacing}>
        <EstablishmentCard
          establishment={item}
          unavailableReason={unavailableReason(item)}
          onPress={() => onSelect(item)}
        />
      </View>
    ),
    [onSelect, unavailableReason]
  );
  const keyExtractor = useCallback(
    (item: EducationEstablishment) => item.id,
    []
  );

  const found =
    lookup.data?.status === 'found' ? lookup.data.establishment : null;
  const showEmpty =
    !search.isFetching &&
    query.trim().length >= 2 &&
    search.establishments.length === 0;

  const header = (
    <View style={styles.header}>
      <View style={[styles.tabs, { backgroundColor: theme.iconBg }]}>
        {(['search', 'uai'] as const).map(value => (
          <TouchableOpacity
            key={value}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === value }}
            onPress={() => setTab(value)}
            style={[
              styles.tab,
              tab === value && { backgroundColor: theme.card },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                { color: tab === value ? theme.text : theme.textMuted },
              ]}
            >
              {t(
                value === 'search'
                  ? 'directory_search_option'
                  : 'directory_uai_option'
              )}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'search' ? (
        <View
          style={[
            styles.searchRow,
            { backgroundColor: theme.input, borderColor: theme.inputBorder },
          ]}
        >
          <Ionicons name="search" size={18} color={theme.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            autoCapitalize="words"
            autoCorrect={false}
            placeholder={t('directory_search_placeholder')}
            placeholderTextColor={theme.placeholder}
            style={[styles.searchInput, { color: theme.text }]}
          />
          {query.length > 0 && (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={t('directory_close')}
              onPress={() => setQuery('')}
              hitSlop={10}
            >
              <Ionicons name="close-circle" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.uaiBlock}>
          <TextInput
            value={uaiInput}
            onChangeText={setUaiInput}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={12}
            placeholder="1234567A"
            placeholderTextColor={theme.placeholder}
            style={[
              styles.uaiInput,
              {
                backgroundColor: theme.input,
                borderColor: lookupError ? theme.red : theme.inputBorder,
                color: theme.text,
              },
            ]}
          />
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => setRequestedUai(normalizeUai(uaiInput))}
            disabled={!uaiInput.trim() || lookup.isFetching}
            style={[
              styles.uaiButton,
              {
                backgroundColor: theme.primary,
                opacity: uaiInput.trim() ? 1 : 0.45,
              },
            ]}
          >
            {lookup.isFetching ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.uaiButtonText}>
                {t('directory_search_action')}
              </Text>
            )}
          </TouchableOpacity>
          {lookupError && (
            <Text style={[styles.message, { color: theme.red }]}>
              {t(`directory_error_${lookupError}`)}
            </Text>
          )}
          {found && (
            <EstablishmentCard
              establishment={found}
              unavailableReason={unavailableReason(found)}
              onPress={() => onSelect(found)}
            />
          )}
        </View>
      )}

      {tab === 'search' &&
        search.isFetching &&
        search.establishments.length === 0 && (
          <ActivityIndicator color={theme.primary} style={styles.spacer} />
        )}
      {tab === 'search' && search.isError && (
        <TouchableOpacity onPress={() => search.refetch()} style={styles.retry}>
          <Text style={[styles.message, { color: theme.red }]}>
            {t('directory_network_retry')}
          </Text>
        </TouchableOpacity>
      )}
      {tab === 'search' && showEmpty && (
        <Text
          style={[styles.message, styles.centered, { color: theme.textMuted }]}
        >
          {t('directory_empty')}
        </Text>
      )}
    </View>
  );

  return (
    <FlatList
      data={tab === 'search' ? search.establishments : []}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ListHeaderComponent={header}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerStyle={styles.listContent}
      onEndReached={() => {
        if (search.hasNextPage && !search.isFetchingNextPage) {
          search.fetchNextPage();
        }
      }}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        search.isFetchingNextPage ? (
          <ActivityIndicator color={theme.primary} style={styles.spacer} />
        ) : null
      }
    />
  );
});

const styles = StyleSheet.create({
  listContent: { paddingBottom: 24 },
  header: { gap: 12, paddingBottom: 12 },
  tabs: { flexDirection: 'row', borderRadius: 14, padding: 4, gap: 4 },
  tab: {
    flex: 1,
    minHeight: 44,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  tabText: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 52,
    borderRadius: 15,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
  uaiBlock: { gap: 12 },
  uaiInput: {
    minHeight: 52,
    borderRadius: 15,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    letterSpacing: 1,
  },
  uaiButton: {
    minHeight: 50,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uaiButtonText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  itemSpacing: { marginBottom: 10 },
  message: { fontSize: 13, lineHeight: 19 },
  centered: { textAlign: 'center', marginTop: 8 },
  retry: { minHeight: 44, justifyContent: 'center' },
  spacer: { marginVertical: 12 },
});
