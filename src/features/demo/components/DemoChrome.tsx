import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, Text, View } from 'react-native';
import {
  SafeAreaInsetsContext,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppIcon } from '@/shared/ui/icons/AppIcon';
import { ParentIcon } from '@/shared/ui/icons/ParentIcon';
import { CollectorIcon } from '@/shared/ui/icons/CollectorIcon';
import { SchoolIcon } from '@/shared/ui/icons/SchoolIcon';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { leaveDemo } from '@/features/auth/store/auth.store';
import { DEMO_GUIDE_STEPS, useDemoStore } from '../store/demo.store';
import type { DemoRole } from '../domain/types';

const MENU_ICON_SIZE = 44;

const ROLES: readonly DemoRole[] = ['parent', 'collector', 'establishment'];

function DemoGuide({ role, step }: { role: DemoRole; step: number }) {
  const theme = useTheme();
  const { t } = useTranslation('demo');
  const next = useDemoStore(s => s.nextGuideStep);
  const dismiss = useDemoStore(s => s.dismissGuide);
  const isLast = step + 1 === DEMO_GUIDE_STEPS;

  return (
    <View
      accessibilityLiveRegion="polite"
      style={{
        marginHorizontal: 12,
        marginBottom: 8,
        padding: 12,
        borderRadius: 14,
        backgroundColor: theme.card,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={{ color: theme.textMuted, fontSize: 12, fontWeight: '700' }}
        >
          {t('guide_step', { current: step + 1, total: DEMO_GUIDE_STEPS })}
        </Text>
        <Text
          style={{
            color: theme.text,
            fontSize: 14,
            fontWeight: '600',
            marginTop: 2,
          }}
        >
          {t(`guide_${role}_${step + 1}`)}
        </Text>
      </View>
      <Pressable
        onPress={dismiss}
        accessibilityRole="button"
        hitSlop={8}
        style={{ paddingHorizontal: 8, paddingVertical: 10 }}
      >
        <Text style={{ color: theme.textSecondary, fontWeight: '700' }}>
          {t('guide_skip')}
        </Text>
      </Pressable>
      <Pressable
        onPress={next}
        accessibilityRole="button"
        style={{
          backgroundColor: theme.primary,
          borderRadius: 10,
          paddingHorizontal: 14,
          paddingVertical: 10,
        }}
      >
        <Text style={{ color: '#fff', fontWeight: '800' }}>
          {isLast ? t('guide_done') : t('guide_next')}
        </Text>
      </Pressable>
    </View>
  );
}

function MenuAction({
  icon,
  label,
  onPress,
  current = false,
  currentLabel,
  tone = 'default',
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  current?: boolean;
  currentLabel?: string;
  tone?: 'default' | 'danger';
}) {
  const theme = useTheme();
  const color = tone === 'danger' ? theme.red : theme.text;
  return (
    <Pressable
      cssInterop={false}
      onPress={onPress}
      disabled={current}
      accessibilityRole="button"
      accessibilityState={{ selected: current }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        minHeight: 64,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 18,
        backgroundColor: theme.card,
        borderWidth: 1.5,
        borderColor: current
          ? theme.accent
          : pressed
            ? theme.primary
            : theme.cardBorder,
        transform: [{ scale: pressed ? 0.985 : 1 }],
      })}
    >
      {icon}
      <Text style={{ color, fontSize: 16, fontWeight: '700', flex: 1 }}>
        {label}
      </Text>
      {current ? (
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 999,
            backgroundColor: theme.accentBg,
          }}
        >
          <Text
            style={{ color: theme.accent, fontSize: 12, fontWeight: '800' }}
          >
            {currentLabel}
          </Text>
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
      )}
    </Pressable>
  );
}

function DemoMenu({
  role,
  visible,
  onClose,
}: {
  role: DemoRole;
  visible: boolean;
  onClose: () => void;
}) {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('demo');
  const enter = useDemoStore(s => s.enter);
  const reset = useDemoStore(s => s.reset);
  const showGuide = useDemoStore(s => s.showGuide);

  const switchTo = useCallback(
    (next: DemoRole) => {
      onClose();
      enter(next);
    },
    [enter, onClose]
  );

  const restart = useCallback(() => {
    Alert.alert(t('restart_confirm_title'), t('restart_confirm_body'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('restart_confirm_ok'),
        style: 'destructive',
        onPress: () => {
          onClose();
          reset();
          router.replace('/demo');
        },
      },
    ]);
  }, [t, onClose, reset, router]);

  const replayGuide = useCallback(() => {
    onClose();
    showGuide();
  }, [onClose, showGuide]);

  const exit = useCallback(() => {
    onClose();
    leaveDemo();
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        accessibilityLabel={t('menu_close')}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.45)',
          justifyContent: 'flex-end',
        }}
      >
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: theme.bg,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: 20,
            paddingTop: 10,
            paddingBottom: insets.bottom + 20,
            gap: 10,
          }}
        >
          <View
            style={{
              alignSelf: 'center',
              width: 40,
              height: 5,
              borderRadius: 3,
              backgroundColor: theme.cardBorder,
              marginBottom: 8,
            }}
          />
          <Text
            accessibilityRole="header"
            style={{ color: theme.text, fontSize: 20, fontWeight: '800' }}
          >
            {t('menu_title')}
          </Text>
          <Text
            style={{
              color: theme.textSecondary,
              fontSize: 14,
              marginBottom: 4,
            }}
          >
            {t('menu_current_role', { role: t(`role_${role}_title`) })}
          </Text>
          <Text
            style={{
              color: theme.textMuted,
              fontSize: 12,
              fontWeight: '700',
              marginTop: 4,
            }}
          >
            {t('menu_switch_role').toUpperCase()}
          </Text>
          {ROLES.map(item => (
            <MenuAction
              key={item}
              icon={
                item === 'parent' ? (
                  <ParentIcon size={MENU_ICON_SIZE} />
                ) : item === 'collector' ? (
                  <CollectorIcon size={MENU_ICON_SIZE} />
                ) : (
                  <SchoolIcon size={MENU_ICON_SIZE} />
                )
              }
              label={t(`role_${item}_title`)}
              current={item === role}
              currentLabel={t('menu_current')}
              onPress={() => switchTo(item)}
            />
          ))}
          <View style={{ height: 6 }} />
          <MenuAction
            icon={<AppIcon name="help" tone="amber" size={MENU_ICON_SIZE} />}
            label={t('menu_guide')}
            onPress={replayGuide}
          />
          <MenuAction
            icon={
              <AppIcon name="refresh" tone="primary" size={MENU_ICON_SIZE} />
            }
            label={t('menu_restart')}
            onPress={restart}
          />
          <MenuAction
            icon={<AppIcon name="logout" tone="red" size={MENU_ICON_SIZE} />}
            label={t('menu_exit')}
            onPress={exit}
            tone="danger"
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function DemoChrome({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('demo');
  const role = useDemoStore(s => s.role);
  const guideStep = useDemoStore(s => s.guideStep);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const contentInsets = useMemo(
    () => (role ? { ...insets, top: 0 } : insets),
    [role, insets]
  );

  return (
    <View style={{ flex: 1 }}>
      {role && (
        <View
          style={{ paddingTop: insets.top, backgroundColor: theme.primary }}
        >
          <Pressable
            onPress={() => setMenuOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={t('badge_a11y')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              minHeight: 40,
              paddingHorizontal: 16,
            }}
          >
            <Ionicons name="flask-outline" size={16} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>
              {t('badge')} · {t(`role_${role}_title`)}
            </Text>
            <Ionicons name="menu" size={18} color="#fff" />
          </Pressable>
          {guideStep !== null && <DemoGuide role={role} step={guideStep} />}
          <DemoMenu role={role} visible={menuOpen} onClose={closeMenu} />
        </View>
      )}
      <SafeAreaInsetsContext.Provider value={contentInsets}>
        {children}
      </SafeAreaInsetsContext.Provider>
    </View>
  );
}
