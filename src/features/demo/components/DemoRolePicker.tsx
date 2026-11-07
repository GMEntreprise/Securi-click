import React, { useCallback } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, type Href } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { leaveDemo } from '@/features/auth/store/auth.store';
import { DEMO_ROLE_HOMES } from '../domain/resolveDemoEntry';
import type { DemoRole } from '../domain/types';
import { isDemoActive, useDemoStore } from '../store/demo.store';
import { useHideSplash } from './useHideSplash';

const ROLES: {
  role: DemoRole;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}[] = [
  { role: 'parent', icon: 'account-group' },
  { role: 'collector', icon: 'shield-check' },
  { role: 'establishment', icon: 'school' },
];

export function DemoRolePicker() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation('demo');
  const enter = useDemoStore(s => s.enter);
  useHideSplash();

  const open = useCallback(
    (role: DemoRole) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      enter(role);
      router.replace(DEMO_ROLE_HOMES[role] as Href);
    },
    [enter, router]
  );

  const back = useCallback(async () => {
    if (isDemoActive()) await leaveDemo();
    router.replace('/(auth)/login');
  }, [router]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: 24,
        gap: 14,
      }}
    >
      <Pressable
        cssInterop={false}
        onPress={back}
        accessibilityRole="button"
        hitSlop={10}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          minHeight: 44,
          alignSelf: 'flex-start',
        }}
      >
        <Ionicons name="chevron-back" size={20} color={theme.textSecondary} />
        <Text
          style={{
            color: theme.textSecondary,
            fontSize: 15,
            fontWeight: '600',
          }}
        >
          {t('picker_back')}
        </Text>
      </Pressable>

      <Text
        accessibilityRole="header"
        style={{ fontSize: 28, fontWeight: '800', color: theme.text }}
      >
        {t('picker_title')}
      </Text>
      <Text
        style={{ fontSize: 15, color: theme.textSecondary, marginBottom: 8 }}
      >
        {t('picker_subtitle')}
      </Text>

      {ROLES.map(({ role, icon }) => (
        <Pressable
          cssInterop={false}
          key={role}
          onPress={() => open(role)}
          accessibilityRole="button"
          accessibilityLabel={`${t(`role_${role}_cta`)}. ${t(`role_${role}_desc`)}`}
          style={({ pressed }) => ({
            padding: 18,
            borderRadius: 24,
            backgroundColor: theme.card,
            borderWidth: 2,
            borderColor: pressed ? theme.primary : theme.cardBorder,
            gap: 12,
          })}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 18,
                backgroundColor: theme.primaryBg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialCommunityIcons
                name={icon}
                size={26}
                color={theme.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 17, fontWeight: '800', color: theme.text }}
              >
                {t(`role_${role}_title`)}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: theme.textSecondary,
                  marginTop: 2,
                }}
              >
                {t(`role_${role}_desc`)}
              </Text>
            </View>
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: theme.primary,
              borderRadius: 14,
              minHeight: 48,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>
              {t(`role_${role}_cta`)}
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </View>
        </Pressable>
      ))}

      <View
        style={{
          flexDirection: 'row',
          gap: 8,
          alignItems: 'flex-start',
          marginTop: 4,
        }}
      >
        <Ionicons
          name="information-circle-outline"
          size={18}
          color={theme.textMuted}
        />
        <Text
          style={{
            flex: 1,
            color: theme.textMuted,
            fontSize: 13,
            lineHeight: 19,
          }}
        >
          {t('picker_notice')}
        </Text>
      </View>
    </ScrollView>
  );
}
