import { memo, useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
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

type Mode = 'choice' | 'search' | 'uai' | 'confirm';

interface Props {
  confirmed?: EducationEstablishment | null;
  purpose?: EstablishmentSelectionPurpose;
  onConfirm: (establishment: EducationEstablishment) => void;
  onModify?: () => void;
}

export const EstablishmentSelector = memo(function EstablishmentSelector({
  confirmed,
  purpose = 'claim',
  onConfirm,
  onModify,
}: Props) {
  const theme = useTheme();
  const { t } = useTranslation('school');
  const [mode, setMode] = useState<Mode>(confirmed ? 'confirm' : 'choice');
  const [query, setQuery] = useState('');
  const [uaiInput, setUaiInput] = useState('');
  const [requestedUai, setRequestedUai] = useState('');
  const [candidate, setCandidate] = useState<EducationEstablishment | null>(
    confirmed ?? null
  );
  const search = useDebouncedDirectorySearch(query);
  const lookup = useEstablishmentByUai(requestedUai, requestedUai.length > 0);
  const candidateUnavailable = !canConfirmEstablishment(candidate, purpose);

  const lookupError = useMemo(() => {
    if (requestedUai && !isValidUaiFormat(requestedUai)) return 'invalid_uai';
    return lookup.data?.status && lookup.data.status !== 'found'
      ? lookup.data.status
      : null;
  }, [lookup.data, requestedUai]);

  const selectCandidate = useCallback(
    (establishment: EducationEstablishment) => {
      setCandidate(establishment);
      setMode('confirm');
    },
    []
  );
  const confirm = useCallback(() => {
    if (candidate && !candidateUnavailable) onConfirm(candidate);
  }, [candidate, candidateUnavailable, onConfirm]);
  const modify = useCallback(() => {
    setCandidate(null);
    setMode('choice');
    setRequestedUai('');
    onModify?.();
  }, [onModify]);
  const submitUai = useCallback(
    () => setRequestedUai(normalizeUai(uaiInput)),
    [uaiInput]
  );
  const renderItem = useCallback(
    ({ item }: { item: EducationEstablishment }) => (
      <View style={{ marginBottom: 10 }}>
        <EstablishmentCard
          establishment={item}
          actionLabel={t('directory_select')}
          onPress={() => selectCandidate(item)}
        />
      </View>
    ),
    [selectCandidate, t]
  );
  const keyExtractor = useCallback(
    (item: EducationEstablishment) => item.id,
    []
  );

  if (mode === 'confirm' && candidate) {
    return (
      <View style={{ gap: 12 }}>
        <Text style={{ color: theme.text, fontSize: 20, fontWeight: '800' }}>
          {t('directory_confirm_title')}
        </Text>
        <EstablishmentCard establishment={candidate} />
        {purpose === 'claim' && candidate.is_claimed && (
          <Text style={{ color: theme.red, fontSize: 13, lineHeight: 19 }}>
            {t('directory_already_claimed')}
          </Text>
        )}
        {purpose === 'parent-link' && !candidate.is_claimed && (
          <Text style={{ color: theme.red, fontSize: 13, lineHeight: 19 }}>
            {t('directory_not_on_securiclick')}
          </Text>
        )}
        <TouchableOpacity
          accessibilityRole="button"
          onPress={confirm}
          disabled={candidateUnavailable}
          style={{
            minHeight: 50,
            borderRadius: 15,
            backgroundColor: theme.primary,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: candidateUnavailable ? 0.45 : 1,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '800' }}>
            {t('directory_confirm')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={modify}
          style={{
            minHeight: 48,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: theme.primary, fontWeight: '700' }}>
            {t('directory_modify')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (mode === 'choice') {
    return (
      <View style={{ gap: 12 }}>
        <Text style={{ color: theme.text, fontSize: 22, fontWeight: '800' }}>
          {t('directory_title')}
        </Text>
        <Text
          style={{ color: theme.textSecondary, fontSize: 14, lineHeight: 20 }}
        >
          {t('directory_subtitle')}
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => setMode('search')}
          style={{
            minHeight: 56,
            borderRadius: 16,
            backgroundColor: theme.primary,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Ionicons name="search-outline" size={18} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '800' }}>
            {t('directory_search_option')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => setMode('uai')}
          style={{
            minHeight: 56,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.primary,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Ionicons name="key-outline" size={18} color={theme.primary} />
          <Text style={{ color: theme.primary, fontWeight: '800' }}>
            {t('directory_uai_option')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (mode === 'uai') {
    const found =
      lookup.data?.status === 'found' ? lookup.data.establishment : null;
    return (
      <View style={{ gap: 12 }}>
        <TouchableOpacity
          onPress={() => setMode('choice')}
          style={{ minHeight: 48, justifyContent: 'center' }}
        >
          <Text style={{ color: theme.primary, fontWeight: '700' }}>
            ‹ {t('directory_back')}
          </Text>
        </TouchableOpacity>
        <Text style={{ color: theme.text, fontSize: 20, fontWeight: '800' }}>
          {t('directory_uai_title')}
        </Text>
        <TextInput
          value={uaiInput}
          onChangeText={setUaiInput}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={12}
          placeholder="1234567A"
          placeholderTextColor={theme.placeholder}
          style={{
            minHeight: 52,
            borderRadius: 15,
            borderWidth: 1,
            borderColor: lookupError ? theme.red : theme.inputBorder,
            backgroundColor: theme.input,
            color: theme.text,
            paddingHorizontal: 16,
            fontSize: 16,
            letterSpacing: 1,
          }}
        />
        <TouchableOpacity
          accessibilityRole="button"
          onPress={submitUai}
          disabled={!uaiInput.trim() || lookup.isFetching}
          style={{
            minHeight: 50,
            borderRadius: 15,
            backgroundColor: theme.primary,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: !uaiInput.trim() ? 0.45 : 1,
          }}
        >
          {lookup.isFetching ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: '800' }}>
              {t('directory_search_action')}
            </Text>
          )}
        </TouchableOpacity>
        {lookupError && (
          <Text style={{ color: theme.red, lineHeight: 19 }}>
            {t(`directory_error_${lookupError}`)}
          </Text>
        )}
        {found && (
          <EstablishmentCard
            establishment={found}
            actionLabel={t('directory_use')}
            onPress={() => selectCandidate(found)}
          />
        )}
      </View>
    );
  }

  return (
    <View style={{ gap: 12 }}>
      <TouchableOpacity
        onPress={() => setMode('choice')}
        style={{ minHeight: 48, justifyContent: 'center' }}
      >
        <Text style={{ color: theme.primary, fontWeight: '700' }}>
          ‹ {t('directory_back')}
        </Text>
      </TouchableOpacity>
      <TextInput
        value={query}
        onChangeText={setQuery}
        autoCapitalize="words"
        placeholder={t('directory_search_placeholder')}
        placeholderTextColor={theme.placeholder}
        style={{
          minHeight: 52,
          borderRadius: 15,
          borderWidth: 1,
          borderColor: theme.inputBorder,
          backgroundColor: theme.input,
          color: theme.text,
          paddingHorizontal: 16,
        }}
      />
      {search.isFetching && search.establishments.length === 0 && (
        <ActivityIndicator color={theme.primary} />
      )}
      {search.isError && (
        <TouchableOpacity
          onPress={() => search.refetch()}
          style={{ minHeight: 48, justifyContent: 'center' }}
        >
          <Text style={{ color: theme.red }}>
            {t('directory_network_retry')}
          </Text>
        </TouchableOpacity>
      )}
      {!search.isFetching &&
        query.trim().length >= 2 &&
        search.establishments.length === 0 && (
          <Text style={{ color: theme.textMuted, textAlign: 'center' }}>
            {t('directory_empty')}
          </Text>
        )}
      <FlatList
        data={search.establishments}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        keyboardShouldPersistTaps="handled"
        style={{ maxHeight: 420 }}
        onEndReached={() =>
          search.hasNextPage &&
          !search.isFetchingNextPage &&
          search.fetchNextPage()
        }
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          search.isFetchingNextPage ? (
            <ActivityIndicator color={theme.primary} />
          ) : null
        }
      />
    </View>
  );
});
