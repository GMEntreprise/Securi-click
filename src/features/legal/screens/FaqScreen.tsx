import React, { memo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';

export type FaqRole = 'parent' | 'collector' | 'school';

interface FaqEntry {
  q: string;
  a: string;
}

const FAQ_SIZE: Record<FaqRole, number> = {
  parent: 8,
  collector: 8,
  school: 8,
};

function faqEntries(role: FaqRole): FaqEntry[] {
  return Array.from({ length: FAQ_SIZE[role] }, (_, index) => ({
    q: `faq_${role}_${index + 1}_q`,
    a: `faq_${role}_${index + 1}_a`,
  }));
}

const FaqItem = memo(function FaqItem({
  entry,
  index,
}: {
  entry: FaqEntry;
  index: number;
}) {
  const t = useTheme();
  const { t: i18n } = useTranslation('legal');
  const [open, setOpen] = useState(false);

  return (
    <Animated.View entering={FadeInDown.delay(index * 40).duration(280)}>
      <TouchableOpacity
        onPress={() => setOpen(v => !v)}
        activeOpacity={0.8}
        style={{
          backgroundColor: t.card,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: open ? t.accent : t.cardBorder,
          marginBottom: 10,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 14,
            gap: 12,
          }}
        >
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 8,
              backgroundColor: open ? t.accentBg : t.iconBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: '800',
                color: open ? t.accent : t.textMuted,
              }}
            >
              {index + 1}
            </Text>
          </View>
          <Text
            style={{
              flex: 1,
              fontSize: 14,
              fontWeight: '700',
              color: open ? t.accent : t.text,
              lineHeight: 20,
            }}
          >
            {i18n(entry.q)}
          </Text>
          {open ? (
            <Ionicons name="chevron-up" size={16} color={t.accent} />
          ) : (
            <Ionicons name="chevron-down" size={16} color={t.textMuted} />
          )}
        </View>
        {open && (
          <View
            style={{
              paddingHorizontal: 16,
              paddingBottom: 16,
              paddingTop: 2,
              borderTopWidth: 1,
              borderTopColor: t.separator,
            }}
          >
            <Text
              style={{ fontSize: 14, color: t.textSecondary, lineHeight: 22 }}
            >
              {i18n(entry.a)}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});

export const FaqScreen = memo(({ role }: { role: FaqRole }) => {
  const t = useTheme();
  const { t: i18n } = useTranslation('legal');
  const insets = useSafeAreaInsets();
  const entries = faqEntries(role);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: insets.bottom + 40,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Text
        style={{
          fontSize: 11,
          fontWeight: '700',
          color: t.textMuted,
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 6,
        }}
      >
        {i18n('faq_count', { count: entries.length })}
      </Text>
      <Text
        style={{
          fontSize: 13,
          color: t.textSecondary,
          marginBottom: 20,
          lineHeight: 20,
        }}
      >
        {i18n('faq_contact')}{' '}
        <Text style={{ color: t.accent, fontWeight: '600' }}>
          contact@securi-click.com
        </Text>
      </Text>

      {entries.map((entry, i) => (
        <FaqItem key={i} entry={entry} index={i} />
      ))}
    </ScrollView>
  );
});

FaqScreen.displayName = 'FaqScreen';
