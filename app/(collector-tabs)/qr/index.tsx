import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import QRCodeStyled from 'react-native-qrcode-styled';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { AppIcon } from '@/shared/ui/icons/AppIcon';
import { appLocale } from '@/i18n/locale';
import { QrGenerationError } from '@/features/collector/services/collector.service';
import {
  useMyGuardians,
  useCollectorQrCode,
  useCollectorRecentScans,
  useCollectorGenerateQr,
} from '@/features/collector/hooks/useCollector';
import { isDemoActive } from '@/features/demo/store/demo.store';

const STATUS_CFG = {
  completed: {
    icon: 'check' as const,
    tone: 'green' as const,
    color: '#10b981',
    labelKey: 'common:status_completed',
  },
  denied: {
    icon: 'cross' as const,
    tone: 'red' as const,
    color: '#ef4444',
    labelKey: 'common:status_denied',
  },
  cancelled: {
    icon: 'clock' as const,
    tone: 'amber' as const,
    color: '#f59e0b',
    labelKey: 'common:status_cancelled',
  },
} as const;

export default function CollectorQRScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useTranslation('collector');
  const [unlocked, setUnlocked] = useState(isDemoActive);
  const [selectedGuardianIdx, setSelectedGuardianIdx] = useState(0);
  const [showPicker, setShowPicker] = useState(false);

  const qrScale = useSharedValue(1);
  const qrRotate = useSharedValue(0);
  const qrStyle = useAnimatedStyle(() => ({
    transform: [{ scale: qrScale.value }, { rotate: `${qrRotate.value}deg` }],
  }));

  const { data: guardians, isLoading: guardiansLoading } = useMyGuardians();
  const activeGuardians = useMemo(
    () => (guardians ?? []).filter(g => g.is_active),
    [guardians]
  );

  const selectedGuardian = activeGuardians[selectedGuardianIdx] ?? null;
  const childId = selectedGuardian?.child?.id ?? undefined;

  const generateMutation = useCollectorGenerateQr();
  const isGenerating = generateMutation.isPending;
  const { data: recentScans, isLoading: scansLoading } =
    useCollectorRecentScans(childId);
  const { data: activeQr } = useCollectorQrCode(childId);

  const hasAccess = !!selectedGuardian?.is_active;

  const handleBiometric = useCallback(async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t('qr_unlock_prompt'),
        cancelLabel: t('common:cancel'),
      });
      if (result.success) {
        setUnlocked(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch {
      Alert.alert(t('common:error'), t('qr_auth_unavailable'));
      setUnlocked(true);
    }
  }, [t]);

  const handleGenerate = useCallback(() => {
    if (isGenerating) return;
    if (!hasAccess) {
      Alert.alert(t('qr_suspended_title'), t('qr_suspended_body'));
      return;
    }
    if (!selectedGuardian?.child?.id) {
      Alert.alert(t('common:error'), t('qr_child_missing'));
      return;
    }
    if (!unlocked) {
      handleBiometric();
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    qrScale.value = withSpring(0.92, { damping: 10 });
    qrRotate.value = withSequence(
      withTiming(8, { duration: 120 }),
      withTiming(-8, { duration: 120 }),
      withTiming(0, { duration: 120 })
    );
    generateMutation.mutate(
      { childId: selectedGuardian.child.id, guardianId: selectedGuardian.id },
      {
        onSuccess: () => {
          qrScale.value = withSpring(1);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
        onError: (err: unknown) => {
          qrScale.value = withSpring(1);
          if (err instanceof QrGenerationError) {
            Alert.alert(
              err.reason === 'suspended'
                ? t('qr_suspended_title')
                : t('qr_forbidden_title'),
              err.message
            );
          } else {
            Alert.alert(t('common:error'), t('errors:qr_generation_failed'));
          }
        },
      }
    );
  }, [
    isGenerating,
    hasAccess,
    selectedGuardian,
    unlocked,
    handleBiometric,
    qrScale,
    qrRotate,
    generateMutation,
    t,
  ]);

  if (guardiansLoading) {
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

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={{
        paddingTop: insets.top + 20,
        paddingHorizontal: 20,
        paddingBottom: insets.bottom + 100,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Badge statut */}
      <Animated.View
        entering={FadeInDown.duration(400)}
        style={{ alignItems: 'center', marginBottom: 24 }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: hasAccess
              ? theme.accentBg
              : 'rgba(239,68,68,0.12)',
            paddingHorizontal: 14,
            paddingVertical: 6,
            borderRadius: 20,
            marginBottom: 16,
          }}
        >
          <Ionicons
            name={hasAccess ? 'shield-checkmark-outline' : 'shield-outline'}
            size={13}
            color={hasAccess ? theme.accent : '#ef4444'}
          />
          <Text
            style={{
              color: hasAccess ? theme.accent : '#ef4444',
              fontSize: 11,
              fontWeight: '700',
              letterSpacing: 1.2,
              textTransform: 'uppercase',
            }}
          >
            {hasAccess ? t('qr_secure') : t('qr_suspended_title')}
          </Text>
        </View>

        {/* Sélecteur enfant */}
        {activeGuardians.length > 1 ? (
          <TouchableOpacity
            onPress={() => setShowPicker(v => !v)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              backgroundColor: theme.card,
              borderWidth: 1,
              borderColor: theme.cardBorder,
              borderRadius: 16,
              paddingHorizontal: 16,
              paddingVertical: 10,
              marginBottom: 8,
            }}
          >
            <Text
              style={{ color: theme.text, fontSize: 18, fontWeight: '800' }}
            >
              {selectedGuardian
                ? `${selectedGuardian.child?.first_name} ${selectedGuardian.child?.last_name}`
                : t('qr_choose')}
            </Text>
            <Ionicons name="chevron-down" size={16} color={theme.textMuted} />
          </TouchableOpacity>
        ) : (
          <Text
            style={{
              color: theme.text,
              fontSize: 22,
              fontWeight: '800',
              letterSpacing: -0.5,
              marginBottom: 8,
            }}
          >
            {selectedGuardian
              ? `${selectedGuardian.child?.first_name} ${selectedGuardian.child?.last_name}`
              : t('qr_no_access')}
          </Text>
        )}

        {showPicker && (
          <Animated.View
            entering={FadeInDown.duration(200)}
            style={{
              backgroundColor: theme.card,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: theme.cardBorder,
              width: '100%',
              overflow: 'hidden',
              marginBottom: 8,
            }}
          >
            {activeGuardians.map((g, idx) => (
              <TouchableOpacity
                key={g.id}
                onPress={() => {
                  setSelectedGuardianIdx(idx);
                  setShowPicker(false);
                  setUnlocked(false);
                }}
                style={{
                  padding: 14,
                  borderBottomWidth: idx < activeGuardians.length - 1 ? 1 : 0,
                  borderBottomColor: theme.separator,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <AppIcon name="person" tone="accent" size={34} />
                <Text
                  style={{ color: theme.text, fontWeight: '600', fontSize: 14 }}
                >
                  {g.child?.first_name} {g.child?.last_name}
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}
      </Animated.View>

      {/* Carte QR */}
      <Animated.View
        entering={FadeInDown.delay(100).duration(400)}
        style={{ alignItems: 'center', marginBottom: 24 }}
      >
        <Animated.View
          style={[
            qrStyle,
            {
              width: 220,
              height: 220,
              backgroundColor: theme.card,
              borderRadius: 28,
              borderWidth: 2,
              borderColor:
                hasAccess && unlocked
                  ? 'rgba(16,185,129,0.4)'
                  : theme.cardBorder,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: hasAccess && unlocked ? '#10b981' : '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: hasAccess && unlocked ? 0.2 : 0.06,
              shadowRadius: hasAccess && unlocked ? 24 : 12,
              elevation: hasAccess && unlocked ? 12 : 4,
            },
          ]}
        >
          {!hasAccess ? (
            <View
              style={{ alignItems: 'center', gap: 10, paddingHorizontal: 20 }}
            >
              <AppIcon name="warning" tone="red" size={56} />
              <Text
                style={{
                  color: '#ef4444',
                  fontSize: 13,
                  textAlign: 'center',
                  fontWeight: '600',
                }}
              >
                {t('qr_suspended_by_parent')}
              </Text>
            </View>
          ) : unlocked && activeQr ? (
            <QRCodeStyled
              data={activeQr.token}
              size={170}
              padding={10}
              style={{ borderRadius: 12, backgroundColor: '#fff' }}
            />
          ) : unlocked && !activeQr ? (
            <View
              style={{ alignItems: 'center', gap: 10, paddingHorizontal: 20 }}
            >
              <AppIcon name="qr" tone="neutral" size={56} />
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: 13,
                  textAlign: 'center',
                }}
              >
                {t('qr_none_active')}
              </Text>
            </View>
          ) : (
            <View style={{ alignItems: 'center', gap: 10 }}>
              <AppIcon name="lock" tone="neutral" size={64} />
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: 14,
                  fontWeight: '600',
                }}
              >
                {t('qr_locked')}
              </Text>
            </View>
          )}
        </Animated.View>
      </Animated.View>

      {/* Bouton action */}
      {activeGuardians.length > 0 && (
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          style={{ marginBottom: 32 }}
        >
          <TouchableOpacity
            onPress={handleGenerate}
            disabled={isGenerating || !hasAccess}
            style={{
              backgroundColor: hasAccess
                ? unlocked
                  ? theme.accent
                  : theme.isDark
                    ? '#21262d'
                    : '#f3f4f6'
                : 'rgba(239,68,68,0.12)',
              borderRadius: 18,
              paddingVertical: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: isGenerating ? 0.7 : 1,
            }}
          >
            <Ionicons
              name={
                isGenerating
                  ? 'refresh-outline'
                  : !hasAccess
                    ? 'shield-outline'
                    : unlocked
                      ? 'refresh-outline'
                      : 'lock-closed-outline'
              }
              size={18}
              color={
                !hasAccess ? '#ef4444' : unlocked ? '#fff' : theme.textMuted
              }
            />
            <Text
              style={{
                color: !hasAccess
                  ? '#ef4444'
                  : unlocked
                    ? '#fff'
                    : theme.textMuted,
                fontWeight: '700',
                fontSize: 15,
              }}
            >
              {isGenerating
                ? t('qr_generating')
                : !hasAccess
                  ? t('qr_suspended_title')
                  : unlocked
                    ? t('qr_generate')
                    : t('qr_unlock')}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Scans récents */}
      <Animated.View entering={FadeInDown.delay(280).duration(400)}>
        <Text
          style={{
            color: theme.text,
            fontSize: 17,
            fontWeight: '700',
            marginBottom: 12,
          }}
        >
          {t('qr_recent_scans')}
        </Text>
        <View
          style={{
            backgroundColor: theme.card,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: theme.cardBorder,
            overflow: 'hidden',
          }}
        >
          {scansLoading ? (
            <ActivityIndicator color={theme.accent} style={{ padding: 24 }} />
          ) : !recentScans || recentScans.length === 0 ? (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <Text style={{ color: theme.textMuted, fontSize: 14 }}>
                {t('qr_no_recent_scans')}
              </Text>
            </View>
          ) : (
            recentScans.map((scan, i) => {
              const cfg = STATUS_CFG[scan.status] ?? STATUS_CFG.completed;
              const d = new Date(scan.pickup_time);
              return (
                <View
                  key={scan.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 14,
                    borderBottomWidth: i < recentScans.length - 1 ? 1 : 0,
                    borderBottomColor: theme.separator,
                    gap: 12,
                  }}
                >
                  <AppIcon name={cfg.icon} tone={cfg.tone} size={38} />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: theme.text,
                        fontWeight: '600',
                        fontSize: 14,
                      }}
                    >
                      {scan.child?.first_name ?? ''}{' '}
                      {scan.child?.last_name ?? ''}
                    </Text>
                    <Text
                      style={{
                        color: theme.textMuted,
                        fontSize: 11,
                        marginTop: 1,
                      }}
                    >
                      {t('home_date_at_time', {
                        date: d.toLocaleDateString(appLocale()),
                        time: d.toLocaleTimeString(appLocale(), {
                          hour: '2-digit',
                          minute: '2-digit',
                        }),
                      })}
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: `${cfg.color}20`,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: cfg.color,
                        fontSize: 11,
                        fontWeight: '700',
                      }}
                    >
                      {t(cfg.labelKey)}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </Animated.View>
    </ScrollView>
  );
}
