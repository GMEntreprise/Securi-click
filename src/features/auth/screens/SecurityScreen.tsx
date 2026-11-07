import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { useAppNavigation } from '@/navigation/useAppNavigation';
import { useLocalSecurity } from '../hooks/useLocalSecurity';

const TYPE_LABEL_KEY: Record<string, string> = {
  facial: 'security_type_facial',
  fingerprint: 'security_type_fingerprint',
  iris: 'security_type_iris',
  none: 'security_type_none',
};

export function SecurityScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useTranslation('auth');
  const nav = useAppNavigation();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(t('security_delete_title'), t('security_delete_parent_body'), [
      { text: t('common:cancel'), style: 'cancel' },
      {
        text: t('security_delete_confirm'),
        style: 'destructive',
        onPress: async () => {
          setIsDeleting(true);
          try {
            await nav.deleteAccount();
          } catch {
            setIsDeleting(false);
            Alert.alert(t('common:error'), t('security_delete_error'));
          }
        },
      },
    ]);
  }, [nav, t]);

  const {
    capability,
    isEnabled,
    isLoading,
    isMutating,
    enable,
    disable,
    test,
  } = useLocalSecurity();

  const [testResult, setTestResult] = useState<'idle' | 'success' | 'failed'>(
    'idle'
  );

  const biometricLabel = t(
    TYPE_LABEL_KEY[capability?.type ?? 'none'] ?? TYPE_LABEL_KEY.none
  );

  const handleEnable = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await enable();
    if (result === 'success') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (result === 'unavailable') {
      Alert.alert(
        t('security_unavailable_title'),
        t('security_unavailable_body')
      );
    }
  }, [enable, t]);

  const handleDisable = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(t('security_disable_title'), t('security_disable_body'), [
      { text: t('common:cancel'), style: 'cancel' },
      {
        text: t('security_disable_confirm'),
        style: 'destructive',
        onPress: async () => {
          const result = await disable();
          if (result === 'success') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        },
      },
    ]);
  }, [disable, t]);

  const handleTest = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTestResult('idle');
    const ok = await test();
    setTestResult(ok ? 'success' : 'failed');
    Haptics.notificationAsync(
      ok
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Error
    );
    setTimeout(() => setTestResult('idle'), 3000);
  }, [test]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  const canUseBiometric = !!capability?.isAvailable && !!capability.isEnrolled;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: insets.bottom + 40,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero status card */}
      <Animated.View entering={FadeInDown.duration(350)}>
        <View
          style={{
            backgroundColor: isEnabled ? theme.primaryBg : theme.card,
            borderRadius: 22,
            borderWidth: 1.5,
            borderColor: isEnabled ? theme.primary : theme.cardBorder,
            padding: 22,
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: 18,
              backgroundColor: isEnabled ? theme.primary : theme.iconBg,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
            }}
          >
            {isEnabled ? (
              <Ionicons name="shield-checkmark" size={28} color="#fff" />
            ) : (
              <Ionicons
                name="shield-outline"
                size={28}
                color={theme.textMuted}
              />
            )}
          </View>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '800',
              color: theme.text,
              marginBottom: 6,
            }}
          >
            {isEnabled
              ? t('security_enabled_title')
              : t('security_disabled_title')}
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: theme.textSecondary,
              textAlign: 'center',
              lineHeight: 18,
            }}
          >
            {isEnabled
              ? t('security_enabled_body', {
                  method: biometricLabel.toLowerCase(),
                })
              : t('security_disabled_body')}
          </Text>
        </View>
      </Animated.View>

      {/* Compatibilité appareil */}
      <Animated.View
        entering={FadeInDown.delay(60).duration(350)}
        style={{ marginBottom: 16 }}
      >
        <Text
          style={{
            fontSize: 12,
            fontWeight: '700',
            color: theme.textMuted,
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
          }}
        >
          {t('security_device')}
        </Text>
        <View
          style={{
            backgroundColor: theme.card,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: theme.cardBorder,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 16,
              gap: 14,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: canUseBiometric ? theme.greenBg : theme.iconBg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {canUseBiometric ? (
                <Ionicons
                  name="finger-print-outline"
                  size={20}
                  color={theme.green}
                />
              ) : (
                <Ionicons
                  name="phone-portrait-outline"
                  size={20}
                  color={theme.textMuted}
                />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 15, fontWeight: '700', color: theme.text }}
              >
                {canUseBiometric ? biometricLabel : t('security_type_none')}
              </Text>
              <Text
                style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}
              >
                {!capability?.isAvailable
                  ? t('security_not_supported')
                  : !capability.isEnrolled
                    ? t('security_not_enrolled')
                    : t('security_ready')}
              </Text>
            </View>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: canUseBiometric
                  ? theme.green
                  : theme.textMuted,
              }}
            />
          </View>
        </View>
      </Animated.View>

      {/* Actions */}
      <Animated.View
        entering={FadeInDown.delay(120).duration(350)}
        style={{ gap: 12 }}
      >
        <Text
          style={{
            fontSize: 12,
            fontWeight: '700',
            color: theme.textMuted,
            marginBottom: 0,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
          }}
        >
          {t('security_actions')}
        </Text>

        {/* Toggle activation */}
        {!isEnabled ? (
          <TouchableOpacity
            onPress={handleEnable}
            disabled={isMutating || !canUseBiometric}
            style={{
              backgroundColor: canUseBiometric ? theme.primary : theme.iconBg,
              borderRadius: 18,
              padding: 18,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              opacity: isMutating ? 0.6 : 1,
            }}
          >
            {isMutating ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons
                name="shield-checkmark"
                size={22}
                color={canUseBiometric ? '#fff' : theme.textMuted}
              />
            )}
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '700',
                  color: canUseBiometric ? '#fff' : theme.textMuted,
                }}
              >
                {t('security_enable')}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: canUseBiometric
                    ? 'rgba(255,255,255,0.75)'
                    : theme.textMuted,
                  marginTop: 2,
                }}
              >
                {canUseBiometric
                  ? t('security_enable_hint')
                  : t('security_enable_unavailable')}
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <>
            {/* Test */}
            <TouchableOpacity
              onPress={handleTest}
              disabled={isMutating}
              style={{
                backgroundColor: theme.card,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: theme.cardBorder,
                padding: 18,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
              }}
            >
              {testResult === 'success' ? (
                <Ionicons
                  name="checkmark-circle"
                  size={22}
                  color={theme.green}
                />
              ) : testResult === 'failed' ? (
                <Ionicons name="close-circle" size={22} color={theme.red} />
              ) : (
                <Ionicons
                  name="finger-print-outline"
                  size={22}
                  color={theme.accent}
                />
              )}
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 15, fontWeight: '700', color: theme.text }}
                >
                  {t('security_test')}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color:
                      testResult === 'success'
                        ? theme.green
                        : testResult === 'failed'
                          ? theme.red
                          : theme.textMuted,
                    marginTop: 2,
                  }}
                >
                  {testResult === 'success'
                    ? t('security_test_success')
                    : testResult === 'failed'
                      ? t('security_test_failed')
                      : t('security_test_hint')}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Désactiver */}
            <TouchableOpacity
              onPress={handleDisable}
              disabled={isMutating}
              style={{
                backgroundColor: theme.redBg,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: 'transparent',
                padding: 18,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                opacity: isMutating ? 0.6 : 1,
              }}
            >
              {isMutating ? (
                <ActivityIndicator color={theme.red} size="small" />
              ) : (
                <Ionicons name="shield-outline" size={22} color={theme.red} />
              )}
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 15, fontWeight: '700', color: theme.red }}
                >
                  {t('security_disable')}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: theme.red,
                    opacity: 0.7,
                    marginTop: 2,
                  }}
                >
                  {t('security_disable_hint')}
                </Text>
              </View>
            </TouchableOpacity>
          </>
        )}
      </Animated.View>

      {/* Info bas de page */}
      <Animated.View
        entering={FadeInDown.delay(180).duration(350)}
        style={{ marginTop: 28 }}
      >
        <View
          style={{
            backgroundColor: theme.accentBg,
            borderRadius: 16,
            padding: 16,
            flexDirection: 'row',
            gap: 12,
            alignItems: 'flex-start',
          }}
        >
          <Ionicons
            name="shield-checkmark"
            size={16}
            color={theme.accent}
            style={{ marginTop: 1 }}
          />
          <Text
            style={{
              flex: 1,
              fontSize: 12,
              color: theme.accent,
              lineHeight: 18,
            }}
          >
            {t('security_note')}
          </Text>
        </View>
      </Animated.View>

      {/* Zone danger — suppression de compte */}
      <Animated.View
        entering={FadeInDown.delay(240).duration(350)}
        style={{ marginTop: 32 }}
      >
        <Text
          style={{
            fontSize: 12,
            fontWeight: '700',
            color: theme.red,
            marginBottom: 10,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
          }}
        >
          {t('security_danger_zone')}
        </Text>
        <TouchableOpacity
          onPress={handleDeleteAccount}
          disabled={isDeleting}
          activeOpacity={0.8}
          style={{
            backgroundColor: theme.redBg,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: 'rgba(239,68,68,0.25)',
            padding: 18,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            opacity: isDeleting ? 0.6 : 1,
          }}
        >
          {isDeleting ? (
            <ActivityIndicator color={theme.red} size="small" />
          ) : (
            <Ionicons name="trash-outline" size={22} color={theme.red} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: theme.red }}>
              {t('security_delete_title')}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: theme.red,
                opacity: 0.7,
                marginTop: 2,
                lineHeight: 16,
              }}
            >
              {t('security_delete_hint')}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}
