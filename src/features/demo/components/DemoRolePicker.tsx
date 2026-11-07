import React, { useCallback } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useTheme, type AppTheme } from '@/theme';
import { ParentIcon } from '@/shared/ui/icons/ParentIcon';
import { CollectorIcon } from '@/shared/ui/icons/CollectorIcon';
import { SchoolIcon } from '@/shared/ui/icons/SchoolIcon';
import { ROLE_ICON_SIZE, type RoleIconName } from '@/constants/roleIcons';
import { leaveDemo } from '@/features/auth/store/auth.store';
import { DEMO_ROLE_HOMES } from '../domain/resolveDemoEntry';
import type { DemoRole } from '../domain/types';
import { isDemoActive, useDemoStore } from '../store/demo.store';
import { useHideSplash } from './useHideSplash';

const ROLES: { role: DemoRole; icon: RoleIconName }[] = [
  { role: 'parent', icon: 'parent' },
  { role: 'collector', icon: 'collector' },
  { role: 'establishment', icon: 'school' },
];

function roleTint(role: DemoRole, theme: AppTheme): string {
  switch (role) {
    case 'parent':
      return theme.amber;
    case 'collector':
      return theme.green;
    case 'establishment':
      return theme.isDark ? theme.accent : theme.primary;
  }
}

interface RoleCardProps {
  role: DemoRole;
  icon: RoleIconName;
  index: number;
  onOpen: (role: DemoRole) => void;
}

function RoleCard({ role, icon, index, onOpen }: RoleCardProps) {
  const theme = useTheme();
  const { t } = useTranslation('demo');
  const tint = roleTint(role, theme);
  const Icon =
    icon === 'parent'
      ? ParentIcon
      : icon === 'collector'
        ? CollectorIcon
        : SchoolIcon;

  return (
    <Animated.View entering={FadeInDown.delay(120 + index * 70).duration(380)}>
      <Pressable
        cssInterop={false}
        onPress={() => onOpen(role)}
        accessibilityRole="button"
        accessibilityLabel={t(`role_${role}_title`)}
        accessibilityHint={t(`role_${role}_desc`)}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          padding: 18,
          borderRadius: 22,
          backgroundColor: theme.card,
          borderWidth: 1.5,
          borderColor: pressed ? tint : theme.cardBorder,
          transform: [{ scale: pressed ? 0.985 : 1 }],
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: theme.isDark ? 0 : 0.05,
          shadowRadius: 8,
          elevation: 1,
        })}
      >
        <Icon size={ROLE_ICON_SIZE} />

        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ fontSize: 17, fontWeight: '800', color: theme.text }}>
            {t(`role_${role}_title`)}
          </Text>
          <Text
            style={{
              fontSize: 14,
              lineHeight: 20,
              color: theme.textSecondary,
            }}
          >
            {t(`role_${role}_desc`)}
          </Text>
        </View>

        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: theme.iconBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="chevron-forward" size={18} color={theme.text} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

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
        paddingTop: insets.top + 8,
        paddingBottom: insets.bottom + 32,
        paddingHorizontal: 20,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Pressable
        cssInterop={false}
        onPress={back}
        accessibilityRole="button"
        accessibilityLabel={t('picker_back')}
        hitSlop={8}
        style={({ pressed }) => ({
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: theme.card,
          borderWidth: 1,
          borderColor: theme.cardBorder,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.6 : 1,
        })}
      >
        <Ionicons name="chevron-back" size={22} color={theme.text} />
      </Pressable>

      <Animated.View
        entering={FadeInDown.duration(380)}
        style={{ marginTop: 28, marginBottom: 28, gap: 12 }}
      >
        <View
          style={{
            alignSelf: 'flex-start',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 999,
            backgroundColor: theme.accentBg,
          }}
        >
          <Ionicons name="sparkles" size={14} color={theme.accent} />
          <Text
            style={{
              color: theme.accent,
              fontSize: 13,
              fontWeight: '700',
            }}
          >
            {t('picker_badge')}
          </Text>
        </View>
        <Text
          accessibilityRole="header"
          style={{
            fontSize: 30,
            lineHeight: 36,
            fontWeight: '800',
            letterSpacing: -0.5,
            color: theme.text,
          }}
        >
          {t('picker_title')}
        </Text>
        <Text
          style={{ fontSize: 16, lineHeight: 23, color: theme.textSecondary }}
        >
          {t('picker_subtitle')}
        </Text>
      </Animated.View>

      <View style={{ gap: 12 }}>
        {ROLES.map(({ role, icon }, index) => (
          <RoleCard
            key={role}
            role={role}
            icon={icon}
            index={index}
            onOpen={open}
          />
        ))}
      </View>

      <Animated.View
        entering={FadeInDown.delay(360).duration(380)}
        style={{
          flexDirection: 'row',
          gap: 12,
          alignItems: 'center',
          marginTop: 24,
          padding: 16,
          borderRadius: 18,
          backgroundColor: theme.greenBg,
        }}
      >
        <Ionicons name="shield-checkmark" size={22} color={theme.green} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text }}>
            {t('picker_notice_title')}
          </Text>
          <Text
            style={{
              fontSize: 13,
              lineHeight: 19,
              color: theme.textSecondary,
            }}
          >
            {t('picker_notice')}
          </Text>
        </View>
      </Animated.View>
    </ScrollView>
  );
}
