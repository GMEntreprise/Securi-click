import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import React, { memo } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Section = memo(
  ({ title, children }: { title: string; children: React.ReactNode }) => {
    const t = useTheme();
    return (
      <View style={{ marginBottom: 24 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: '700',
            color: t.text,
            marginBottom: 8,
          }}
        >
          {title}
        </Text>
        {children}
      </View>
    );
  }
);

const Body = memo(({ children }: { children: string }) => {
  const t = useTheme();
  return (
    <Text
      style={{
        fontSize: 14,
        color: t.textSecondary,
        lineHeight: 22,
      }}
    >
      {children}
    </Text>
  );
});

export const PrivacyPolicyScreen = memo(() => {
  const t = useTheme();
  const { t: i18n } = useTranslation('legal');
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: insets.bottom + 40,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Text
        style={{
          fontSize: 14,
          color: t.textSecondary,
          lineHeight: 22,
          marginBottom: 24,
        }}
      >
        {i18n('privacy_intro')}
      </Text>

      <Section title={i18n('privacy_title_1')}>
        <Body>{i18n('privacy_body_1')}</Body>
      </Section>

      <Section title={i18n('privacy_title_2')}>
        <Body>{i18n('privacy_body_2')}</Body>
      </Section>

      <Section title={i18n('privacy_title_3')}>
        <Body>{i18n('privacy_body_3')}</Body>
      </Section>

      <Section title={i18n('privacy_title_4')}>
        <Body>{i18n('privacy_body_4')}</Body>
      </Section>

      <Section title={i18n('privacy_title_5')}>
        <Body>{i18n('privacy_body_5')}</Body>
      </Section>

      <Section title={i18n('privacy_title_6')}>
        <Body>{i18n('privacy_body_6')}</Body>
      </Section>

      <Section title={i18n('privacy_title_7')}>
        <Body>{i18n('privacy_body_7')}</Body>
      </Section>

      <Section title={i18n('privacy_title_8')}>
        <View style={{ gap: 6 }}>
          <Body>{i18n('privacy_body_8')}</Body>
          <Pressable onPress={() => Linking.openURL('https://shavod.com')}>
            {({ pressed }) => (
              <Text
                style={{
                  fontSize: 14,
                  color: '#f97316',
                  fontWeight: '600',
                  opacity: pressed ? 0.6 : 1,
                  textDecorationLine: 'underline',
                }}
              >
                shavod.com
              </Text>
            )}
          </Pressable>
        </View>
      </Section>

      <Section title={i18n('privacy_title_9')}>
        <Body>{i18n('privacy_body_9')}</Body>
      </Section>
    </ScrollView>
  );
});

PrivacyPolicyScreen.displayName = 'PrivacyPolicyScreen';
