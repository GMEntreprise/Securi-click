import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, Text, View } from 'react-native';
import {
  SafeAreaInsetsContext,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { leaveDemo } from '@/features/auth/store/auth.store';
import { DEMO_GUIDE_STEPS, useDemoStore } from '../store/demo.store';
import type { DemoRole } from '../domain/types';

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
  disabled = false,
  tone = 'default',
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'default' | 'danger';
}) {
  const theme = useTheme();
  const color = tone === 'danger' ? theme.red : theme.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 48,
        paddingHorizontal: 14,
        borderRadius: 12,
        backgroundColor: theme.iconBg,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Ionicons name={icon} size={20} color={color} />
      <Text style={{ color, fontSize: 15, fontWeight: '700', flex: 1 }}>
        {label}
      </Text>
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
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 20,
            paddingBottom: insets.bottom + 20,
            gap: 10,
          }}
        >
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
                item === 'parent'
                  ? 'people-outline'
                  : item === 'collector'
                    ? 'shield-checkmark-outline'
                    : 'school-outline'
              }
              label={t(`role_${item}_title`)}
              disabled={item === role}
              onPress={() => switchTo(item)}
            />
          ))}
          <View style={{ height: 6 }} />
          <MenuAction
            icon="help-circle-outline"
            label={t('menu_guide')}
            onPress={replayGuide}
          />
          <MenuAction
            icon="refresh-outline"
            label={t('menu_restart')}
            onPress={restart}
          />
          <MenuAction
            icon="log-out-outline"
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
