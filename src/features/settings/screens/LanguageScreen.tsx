import React, { memo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { useTranslation } from 'react-i18next';
import { useLanguageStore } from '@/stores/language.store';
import type { SupportedLanguage } from '@/i18n/resources';

const LANGUAGES: { code: SupportedLanguage; labelKey: 'french' | 'english' }[] =
  [
    { code: 'fr', labelKey: 'french' },
    { code: 'en', labelKey: 'english' },
  ];

export function LanguageScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const router = useRouter();
  const { t: i18n } = useTranslation('common');
  const { language, setLanguage } = useLanguageStore();

  const handleSelect = async (code: SupportedLanguage) => {
    if (code === language) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await setLanguage(code);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* Header */}
      <Animated.View
        entering={FadeInDown.duration(300)}
        style={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 20,
          paddingBottom: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            backgroundColor: theme.iconBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="chevron-back" size={20} color={theme.textSecondary} />
        </TouchableOpacity>
        <Text
          style={{
            color: theme.text,
            fontSize: 20,
            fontWeight: '800',
            letterSpacing: -0.4,
          }}
        >
          {i18n('language')}
        </Text>
      </Animated.View>

      {/* Language list */}
      <Animated.View
        entering={FadeInDown.delay(60).duration(300)}
        style={{
          marginHorizontal: 20,
          marginTop: 8,
          backgroundColor: theme.card,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: theme.cardBorder,
          overflow: 'hidden',
        }}
      >
        {LANGUAGES.map((lang, idx) => {
          const isSelected = language === lang.code;
          return (
            <LanguageRow
              key={lang.code}
              label={i18n(lang.labelKey)}
              selected={isSelected}
              isLast={idx === LANGUAGES.length - 1}
              onPress={() => handleSelect(lang.code)}
            />
          );
        })}
      </Animated.View>
    </View>
  );
}

const LanguageRow = memo(function LanguageRow({
  label,
  selected,
  isLast,
  onPress,
}: {
  label: string;
  selected: boolean;
  isLast: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingVertical: 16,
        gap: 14,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: theme.separator,
        backgroundColor: selected
          ? theme.isDark
            ? 'rgba(249,115,22,0.08)'
            : 'rgba(249,115,22,0.05)'
          : 'transparent',
      }}
    >
      <Text
        style={{
          flex: 1,
          color: theme.text,
          fontSize: 16,
          fontWeight: selected ? '700' : '500',
        }}
      >
        {label}
      </Text>
      {selected && (
        <View
          style={{
            width: 26,
            height: 26,
            borderRadius: 13,
            backgroundColor: theme.accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="checkmark" size={15} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );
});
