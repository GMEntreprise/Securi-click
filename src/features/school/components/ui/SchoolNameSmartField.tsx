import React, { memo, useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  Building2,
  CheckCircle2,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react-native';
import { useTheme } from '@/theme';
import { useSchoolSearch } from '../../hooks/useSchoolSearch';
import type { SchoolSearchResult } from '../../services/schoolSearch.service';

export interface SchoolPrefillData {
  name: string;
  type: string;
  address: string;
  city: string;
  postal_code: string;
}

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onPrefill: (data: SchoolPrefillData) => void;
  placeholder?: string;
  error?: string;
}

const PREFILL_THRESHOLD = 70;

const SuggestionCard = memo(function SuggestionCard({
  school,
  onApply,
  onDismiss,
}: {
  school: SchoolSearchResult;
  onApply: () => void;
  onDismiss: () => void;
}) {
  const theme = useTheme();
  const isStrong = school.confidence >= 85;

  return (
    <Animated.View
      entering={FadeInDown.duration(240)}
      exiting={FadeOutUp.duration(180)}
      style={{
        marginTop: 8,
        backgroundColor: isStrong ? theme.greenBg : theme.primaryBg,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: isStrong ? 'rgba(16,185,129,0.3)' : `${theme.primary}33`,
        overflow: 'hidden',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 6 }}>
        <Sparkles size={12} color={isStrong ? theme.green : theme.primary} strokeWidth={2} />
        <Text style={{ fontSize: 11, fontWeight: '700', color: isStrong ? theme.green : theme.primary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
          {isStrong ? 'Établissement trouvé' : 'Suggestion proche'}
        </Text>
        {school.confidence >= 95 && <ShieldCheck size={11} color={theme.green} strokeWidth={2.5} />}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 10 }}>
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: isStrong ? 'rgba(16,185,129,0.15)' : theme.accentBg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Building2 size={16} color={isStrong ? theme.green : theme.accent} strokeWidth={1.8} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.text, fontSize: 14, fontWeight: '700' }} numberOfLines={1}>
            {school.name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <MapPin size={10} color={theme.textMuted} strokeWidth={2} />
            <Text style={{ color: theme.textMuted, fontSize: 12 }} numberOfLines={1}>
              {school.address}, {school.city}{school.postal_code ? ` (${school.postal_code})` : ''}
            </Text>
          </View>
          <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 2 }}>
            {school.type}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: isStrong ? 'rgba(16,185,129,0.15)' : `${theme.primary}1A` }}>
        <TouchableOpacity onPress={onDismiss} style={{ flex: 1, paddingVertical: 11, alignItems: 'center', borderRightWidth: 1, borderRightColor: isStrong ? 'rgba(16,185,129,0.15)' : `${theme.primary}1A` }}>
          <Text style={{ color: theme.textMuted, fontSize: 13, fontWeight: '600' }}>Ignorer</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onApply} style={{ flex: 2, paddingVertical: 11, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={14} color={isStrong ? theme.green : theme.primary} strokeWidth={2.5} />
            <Text style={{ color: isStrong ? theme.green : theme.primary, fontSize: 13, fontWeight: '700' }}>
              Utiliser ces informations
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
});

export const SchoolNameSmartField = memo(function SchoolNameSmartField({
  value,
  onChangeText,
  onPrefill,
  placeholder = 'ex: École Saint-Joseph, Maternelle...',
  error,
}: Props) {
  const theme = useTheme();
  const inputRef = useRef<TextInput>(null);
  const { query, setQuery, results, isSearching, clear } = useSchoolSearch();
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  const [prefillApplied, setPrefillApplied] = useState(false);

  const handleChange = useCallback(
    (text: string) => {
      onChangeText(text);
      setQuery(text);
      setPrefillApplied(false);
      setDismissedId(null);
    },
    [onChangeText, setQuery]
  );

  const handleClear = useCallback(() => {
    onChangeText('');
    clear();
    setPrefillApplied(false);
    setDismissedId(null);
  }, [onChangeText, clear]);

  const topSuggestion: SchoolSearchResult | null = results[0] ?? null;
  const showSuggestion =
    !prefillApplied &&
    topSuggestion !== null &&
    topSuggestion.confidence >= PREFILL_THRESHOLD &&
    topSuggestion.id !== dismissedId;

  const handleApply = useCallback(() => {
    if (!topSuggestion) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onChangeText(topSuggestion.name);
    onPrefill({
      name: topSuggestion.name,
      type: topSuggestion.type,
      address: topSuggestion.address,
      city: topSuggestion.city,
      postal_code: topSuggestion.postal_code,
    });
    setPrefillApplied(true);
    clear();
    if (__DEV__) console.log('[SchoolNameSmartField] prefill:', topSuggestion.name, `(${topSuggestion.confidence}%)`);
  }, [topSuggestion, onChangeText, onPrefill, clear]);

  const handleDismiss = useCallback(() => {
    if (!topSuggestion) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDismissedId(topSuggestion.id);
  }, [topSuggestion]);

  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ color: theme.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>
        Nom de l'établissement
      </Text>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.input,
          borderWidth: 1,
          borderColor: error ? theme.red : prefillApplied ? 'rgba(16,185,129,0.4)' : theme.inputBorder,
          borderRadius: 14,
          paddingHorizontal: 14,
          gap: 10,
        }}
      >
        {prefillApplied
          ? <CheckCircle2 size={16} color={theme.green} strokeWidth={2} />
          : <Search size={16} color={theme.textMuted} strokeWidth={2} />
        }
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={handleChange}
          placeholder={placeholder}
          placeholderTextColor={theme.placeholder}
          autoCapitalize="words"
          returnKeyType="next"
          style={{ flex: 1, paddingVertical: 14, fontSize: 15, color: theme.text }}
        />
        {isSearching && <ActivityIndicator size="small" color={theme.accent} />}
        {!isSearching && value.length > 0 && (
          <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X size={14} color={theme.textMuted} strokeWidth={2.5} />
          </TouchableOpacity>
        )}
      </View>

      {error ? (
        <Text style={{ color: theme.red, fontSize: 12, marginTop: 4 }}>{error}</Text>
      ) : null}

      {showSuggestion && (
        <SuggestionCard school={topSuggestion} onApply={handleApply} onDismiss={handleDismiss} />
      )}

      {prefillApplied && (
        <Animated.View entering={FadeInDown.duration(200)} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 }}>
          <CheckCircle2 size={12} color={theme.green} strokeWidth={2.5} />
          <Text style={{ color: theme.green, fontSize: 12, fontWeight: '600' }}>
            Informations préremplies automatiquement
          </Text>
        </Animated.View>
      )}
    </View>
  );
});
