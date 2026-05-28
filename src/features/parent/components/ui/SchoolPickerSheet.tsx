import React, { memo, useCallback, useRef } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { useSchoolSearch } from '@/features/school/hooks/useSchoolSearch';
import { SheetModal } from '@/shared/ui/molecules/SheetModal';
import type { SchoolSearchResult } from '@/features/school/services/schoolSearch.service';

interface Props {
  visible: boolean;
  onSelect: (school: SchoolSearchResult) => void;
  onClose: () => void;
}

const SCHOOL_TYPE_LABELS: Record<string, string> = {
  maternelle: 'Maternelle',
  elementaire: 'Élémentaire',
  primaire: 'Primaire',
  college: 'Collège',
  lycee: 'Lycée',
  creche: 'Crèche',
  garderie: 'Garderie',
  centre_aere: 'Centre aéré',
};

function typeLabel(type: string): string {
  return SCHOOL_TYPE_LABELS[type.toLowerCase()] ?? type;
}

const ConfidenceBadge = memo(function ConfidenceBadge({
  score,
}: {
  score: number;
}) {
  const theme = useTheme();
  if (score >= 95) {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 3,
          backgroundColor: theme.greenBg,
          paddingHorizontal: 7,
          paddingVertical: 2,
          borderRadius: 6,
        }}
      >
        <Ionicons name="shield-checkmark" size={10} color={theme.green} />
        <Text style={{ color: theme.green, fontSize: 10, fontWeight: '700' }}>
          Correspondance exacte
        </Text>
      </View>
    );
  }
  if (score >= 70) {
    return (
      <View
        style={{
          backgroundColor: theme.accentBg,
          paddingHorizontal: 7,
          paddingVertical: 2,
          borderRadius: 6,
        }}
      >
        <Text style={{ color: theme.accent, fontSize: 10, fontWeight: '700' }}>
          Suggestion proche
        </Text>
      </View>
    );
  }
  return null;
});

const SchoolCard = memo(function SchoolCard({
  school,
  onPress,
}: {
  school: SchoolSearchResult;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        backgroundColor: theme.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.cardBorder,
        padding: 14,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 13,
          backgroundColor: theme.primaryBg,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Ionicons name="business-outline" size={20} color={theme.primary} />
      </View>

      <View style={{ flex: 1, gap: 3 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            flexWrap: 'wrap',
          }}
        >
          <Text
            style={{
              color: theme.text,
              fontSize: 14,
              fontWeight: '700',
              flexShrink: 1,
            }}
            numberOfLines={1}
          >
            {school.name}
          </Text>
          <ConfidenceBadge score={school.confidence} />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="location-outline" size={11} color={theme.textMuted} />
          <Text
            style={{ color: theme.textMuted, fontSize: 12 }}
            numberOfLines={1}
          >
            {school.address}, {school.city}
            {school.postal_code ? ` (${school.postal_code})` : ''}
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            flexWrap: 'wrap',
          }}
        >
          <Text
            style={{
              color: theme.textSecondary,
              fontSize: 11,
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: 0.4,
            }}
          >
            {typeLabel(school.type)}
          </Text>
          {school.verified && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 3,
                backgroundColor: theme.primaryBg,
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 6,
              }}
            >
              <Ionicons
                name="checkmark-circle"
                size={10}
                color={theme.primary}
              />
              <Text
                style={{
                  color: theme.primary,
                  fontSize: 9,
                  fontWeight: '700',
                  letterSpacing: 0.3,
                }}
              >
                OFFICIEL
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

export const SchoolPickerSheet = memo(function SchoolPickerSheet({
  visible,
  onSelect,
  onClose,
}: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const { query, setQuery, results, isSearching, isEmpty, clear } =
    useSchoolSearch();

  const handleSelect = useCallback(
    (school: SchoolSearchResult) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (__DEV__)
        console.log(
          '[SchoolPicker] sélectionné:',
          school.name,
          `(${school.confidence}%)`
        );
      clear();
      onSelect(school);
    },
    [clear, onSelect]
  );

  const handleClose = useCallback(() => {
    clear();
    onClose();
  }, [clear, onClose]);

  return (
    <SheetModal visible={visible} onRequestClose={handleClose}>
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        {/* Handle */}
        <View
          style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}
        >
          <View
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: theme.cardBorder,
            }}
          />
        </View>

        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(280)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 12,
          }}
        >
          <View>
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: theme.textMuted,
                textTransform: 'uppercase',
                letterSpacing: 1.2,
                marginBottom: 2,
              }}
            >
              Établissement
            </Text>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '800',
                color: theme.text,
                letterSpacing: -0.3,
              }}
            >
              Rechercher l'école
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              backgroundColor: theme.iconBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="close" size={16} color={theme.textMuted} />
          </TouchableOpacity>
        </Animated.View>

        {/* Search input */}
        <Animated.View
          entering={FadeInDown.delay(60).duration(280)}
          style={{ paddingHorizontal: 20, marginBottom: 16 }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: theme.input,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: theme.inputBorder,
              paddingHorizontal: 14,
              gap: 10,
            }}
          >
            <Ionicons name="search-outline" size={16} color={theme.textMuted} />
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={setQuery}
              placeholder="Ex. École Saint-Joseph, Collège..."
              placeholderTextColor={theme.placeholder}
              autoFocus
              autoCapitalize="words"
              returnKeyType="search"
              style={{
                flex: 1,
                paddingVertical: 14,
                fontSize: 15,
                color: theme.text,
              }}
            />
            {query.length > 0 && (
              <TouchableOpacity
                onPress={clear}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={14} color={theme.textMuted} />
              </TouchableOpacity>
            )}
            {isSearching && (
              <ActivityIndicator size="small" color={theme.accent} />
            )}
          </View>
        </Animated.View>

        {/* Results */}
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 40,
          }}
        >
          {/* Hint initial */}
          {query.length < 2 && (
            <Animated.View
              entering={FadeInDown.delay(100).duration(280)}
              style={{ alignItems: 'center', marginTop: 40, gap: 12 }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 18,
                  backgroundColor: theme.primaryBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name="business-outline"
                  size={26}
                  color={theme.primary}
                />
              </View>
              <Text
                style={{
                  color: theme.textMuted,
                  fontSize: 14,
                  textAlign: 'center',
                  lineHeight: 20,
                }}
              >
                Tapez au moins 2 caractères{'\n'}pour rechercher un
                établissement
              </Text>
            </Animated.View>
          )}

          {/* État vide */}
          {isEmpty && (
            <Animated.View
              entering={FadeInDown.duration(280)}
              style={{ alignItems: 'center', marginTop: 40, gap: 12 }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 18,
                  backgroundColor: theme.iconBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name="search-outline"
                  size={24}
                  color={theme.textMuted}
                />
              </View>
              <Text
                style={{
                  color: theme.text,
                  fontSize: 15,
                  fontWeight: '700',
                  textAlign: 'center',
                }}
              >
                Aucun résultat
              </Text>
              <Text
                style={{
                  color: theme.textMuted,
                  fontSize: 13,
                  textAlign: 'center',
                  lineHeight: 19,
                }}
              >
                L'établissement n'est peut-être pas encore inscrit sur
                SecuriClick.{'\n'}Essayez un nom différent.
              </Text>
            </Animated.View>
          )}

          {/* Bannière correspondance exacte */}
          {results.length > 0 && results[0].confidence >= 95 && (
            <Animated.View
              entering={FadeInDown.duration(240)}
              style={{
                backgroundColor: theme.greenBg,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: 'rgba(16,185,129,0.3)',
                padding: 14,
                marginBottom: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <Ionicons name="sparkles-outline" size={16} color={theme.green} />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: theme.green,
                    fontSize: 13,
                    fontWeight: '700',
                  }}
                >
                  Correspondance exacte trouvée
                </Text>
                <Text
                  style={{ color: theme.textMuted, fontSize: 12, marginTop: 1 }}
                  numberOfLines={1}
                >
                  {results[0].name} · {results[0].city}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleSelect(results[0])}
                style={{
                  backgroundColor: theme.green,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <Ionicons name="checkmark-circle" size={13} color="#fff" />
                <Text
                  style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}
                >
                  Confirmer
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Résultats */}
          {results.map((school, idx) => (
            <Animated.View
              key={school.id}
              entering={FadeInDown.delay(idx * 40).duration(260)}
            >
              <SchoolCard
                school={school}
                onPress={() => handleSelect(school)}
              />
            </Animated.View>
          ))}
        </ScrollView>
      </View>
    </SheetModal>
  );
});
