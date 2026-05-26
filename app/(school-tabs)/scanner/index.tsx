import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { useSession } from '@/features/auth/store/auth.store';
import { useMySchool } from '@/features/school/hooks/useSchool';
import { useValidateQr } from '@/features/school/hooks/useValidations';
import { Avatar } from '@/shared/ui/base/avatar';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import type {
  QrScanResult,
  CollectorIdentityStatus,
} from '@/features/school/types';

type ScanState = 'idle' | 'scanning' | 'result';

// ─── Animated scan beam ───────────────────────────────────────────────────────
const ScanBeam = memo(function ScanBeam() {
  const translateY = useSharedValue(-1);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400 }),
        withTiming(-1, { duration: 1400 })
      ),
      -1,
      false
    );
    return () => cancelAnimation(translateY);
  }, [translateY]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value * 110 }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: 4,
          right: 4,
          height: 2,
          borderRadius: 1,
          backgroundColor: 'rgba(255,255,255,0.75)',
          shadowColor: '#fff',
          shadowOpacity: 0.9,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 0 },
        },
        style,
      ]}
    />
  );
});

// ─── Corner brackets ─────────────────────────────────────────────────────────
const Corner = memo(function Corner({
  position,
  active,
}: {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  active: boolean;
}) {
  const isTop = position.startsWith('top');
  const isLeft = position.endsWith('left');
  const color = active ? '#fff' : 'rgba(255,255,255,0.5)';
  return (
    <View
      style={{
        position: 'absolute',
        top: isTop ? 0 : undefined,
        bottom: isTop ? undefined : 0,
        left: isLeft ? 0 : undefined,
        right: isLeft ? undefined : 0,
        width: 32,
        height: 32,
        borderTopWidth: isTop ? 3 : 0,
        borderBottomWidth: isTop ? 0 : 3,
        borderLeftWidth: isLeft ? 3 : 0,
        borderRightWidth: isLeft ? 0 : 3,
        borderColor: color,
        borderTopLeftRadius: isTop && isLeft ? 12 : 0,
        borderTopRightRadius: isTop && !isLeft ? 12 : 0,
        borderBottomLeftRadius: !isTop && isLeft ? 12 : 0,
        borderBottomRightRadius: !isTop && !isLeft ? 12 : 0,
      }}
    />
  );
});

// ─── Identity badge ───────────────────────────────────────────────────────────
const IdentityBadge = memo(function IdentityBadge({
  status,
}: {
  status: CollectorIdentityStatus | undefined;
}) {
  const t = useTheme();

  const cfg = {
    verified: {
      iconName: 'shield-checkmark' as const,
      color: t.green,
      bg: t.greenBg,
      label: 'Identité vérifiée',
    },
    pending: {
      iconName: 'time-outline' as const,
      color: t.amber,
      bg: t.amberBg,
      label: 'Vérification en attente',
    },
    refused: {
      iconName: 'shield-outline' as const,
      color: t.red,
      bg: t.redBg,
      label: 'Identité refusée',
    },
    expired: {
      iconName: 'shield-outline' as const,
      color: t.red,
      bg: t.redBg,
      label: 'Identité expirée',
    },
    none: {
      iconName: 'warning-outline' as const,
      color: t.amber,
      bg: t.amberBg,
      label: 'Identité non vérifiée',
    },
  } as const;

  const key = (status ?? 'none') as keyof typeof cfg;
  const { iconName, color, bg, label } = cfg[key] ?? cfg.none;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: bg,
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 6,
        alignSelf: 'flex-start',
        marginTop: 6,
      }}
    >
      <Ionicons name={iconName} size={13} color={color} />
      <Text style={{ color, fontSize: 12, fontWeight: '700' }}>{label}</Text>
    </View>
  );
});

// ─── Result Bottom Sheet (animated, no pageSheet Modal) ──────────────────────
const ResultSheet = memo(function ResultSheet({
  result,
  onReset,
}: {
  result: QrScanResult;
  onReset: () => void;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(600);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 200 });
    translateY.value = withSpring(0, {
      damping: 26,
      stiffness: 260,
      mass: 0.9,
      overshootClamping: true,
    });
  }, [opacity, translateY]);

  const handleClose = useCallback(() => {
    opacity.value = withTiming(0, { duration: 180 });
    translateY.value = withTiming(600, { duration: 220 }, finished => {
      if (finished) runOnJS(onReset)();
    });
  }, [opacity, translateY, onReset]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const isOk = result.success;
  const statusColor = isOk ? t.green : t.red;
  const statusBg = isOk ? t.greenBg : t.redBg;
  const scanTime = result.scanned_at
    ? new Date(result.scanned_at).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : new Date().toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

  return (
    <>
      {/* Backdrop */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
          },
          backdropStyle,
        ]}
        pointerEvents="box-none"
      />

      {/* Sheet */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: t.bg,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            minHeight: '40%',
            maxHeight: '85%',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.15,
            shadowRadius: 20,
            elevation: 24,
          },
          sheetStyle,
        ]}
      >
        {/* Handle */}
        <View
          style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}
        >
          <View
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: t.inputBorder,
            }}
          />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: insets.bottom + 32,
            gap: 14,
            minHeight: 280,
          }}
        >
          {/* Status banner */}
          <Animated.View
            entering={FadeInDown.duration(280)}
            style={{
              padding: 18,
              borderRadius: 22,
              backgroundColor: statusBg,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
            }}
          >
            {isOk ? (
              <Ionicons name="checkmark-circle" size={44} color={statusColor} />
            ) : (
              <Ionicons name="close-circle" size={44} color={statusColor} />
            )}
            <View style={{ flex: 1 }}>
              <Text
                style={{ color: statusColor, fontSize: 20, fontWeight: '800' }}
              >
                {isOk ? 'Accès autorisé' : 'Accès refusé'}
              </Text>
              {!isOk && result.refusal_reason && (
                <Text
                  style={{
                    color: statusColor,
                    fontSize: 13,
                    marginTop: 3,
                    opacity: 0.9,
                    lineHeight: 18,
                  }}
                >
                  {result.refusal_reason}
                </Text>
              )}
              {isOk && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                    marginTop: 4,
                  }}
                >
                  <Ionicons name="time-outline" size={12} color={statusColor} />
                  <Text
                    style={{
                      color: statusColor,
                      fontSize: 12,
                      opacity: 0.85,
                      fontWeight: '600',
                    }}
                  >
                    {scanTime}
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>

          {/* Child card */}
          {result.child && (
            <Animated.View
              entering={FadeInDown.delay(60).duration(280)}
              style={{
                backgroundColor: t.card,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: t.cardBorder,
                padding: 16,
              }}
            >
              <SectionHeader icon="child" label="Enfant" />
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}
              >
                <Avatar
                  image={{
                    uri: result.child.photo_url ?? '',
                    name: `${result.child.first_name} ${result.child.last_name}`,
                  }}
                  size={64}
                  showBorder={false}
                  backgroundColor={t.primaryBg}
                  textColor={t.primary}
                />
                <View>
                  <Text
                    style={{ color: t.text, fontSize: 17, fontWeight: '800' }}
                  >
                    {result.child.first_name} {result.child.last_name}
                  </Text>
                  {result.child.class_name && (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 5,
                        marginTop: 4,
                      }}
                    >
                      <Ionicons
                        name="school-outline"
                        size={13}
                        color={t.textMuted}
                      />
                      <Text style={{ color: t.textMuted, fontSize: 13 }}>
                        {result.child.class_name}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </Animated.View>
          )}

          {/* Collector card */}
          {result.guardian ? (
            <Animated.View
              entering={FadeInDown.delay(100).duration(280)}
              style={{
                backgroundColor: t.card,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: t.cardBorder,
                padding: 16,
              }}
            >
              <SectionHeader icon="collector" label="QR Collecteur" />
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}
              >
                <Avatar
                  image={{
                    uri: result.guardian.photo_url ?? '',
                    name: `${result.guardian.first_name} ${result.guardian.last_name}`,
                  }}
                  size={64}
                  showBorder={false}
                  backgroundColor={t.accentBg}
                  textColor={t.accent}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ color: t.text, fontSize: 17, fontWeight: '800' }}
                  >
                    {result.guardian.first_name} {result.guardian.last_name}
                  </Text>
                  <Text
                    style={{ color: t.textMuted, fontSize: 13, marginTop: 2 }}
                  >
                    {result.guardian.relationship}
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                      marginTop: 3,
                    }}
                  >
                    <Ionicons
                      name="call-outline"
                      size={12}
                      color={t.textMuted}
                    />
                    <Text style={{ color: t.textSecondary, fontSize: 13 }}>
                      {result.guardian.phone}
                    </Text>
                  </View>
                  <IdentityBadge status={result.guardian.identity_status} />
                </View>
              </View>
            </Animated.View>
          ) : (
            <Animated.View
              entering={FadeInDown.delay(100).duration(280)}
              style={{
                backgroundColor: t.card,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: t.cardBorder,
                padding: 16,
              }}
            >
              <SectionHeader icon="parent" label="QR Parent direct" />
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  backgroundColor: t.primaryBg,
                  borderRadius: 14,
                  padding: 14,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: t.bg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons
                    name="qr-code-outline"
                    size={20}
                    color={t.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ color: t.text, fontSize: 15, fontWeight: '700' }}
                  >
                    QR généré par le parent
                  </Text>
                  <Text
                    style={{ color: t.textMuted, fontSize: 13, marginTop: 2 }}
                  >
                    Aucun collecteur assigné à ce scan
                  </Text>
                </View>
              </View>
            </Animated.View>
          )}

          {/* CTA */}
          <Animated.View entering={FadeInDown.delay(140).duration(280)}>
            <TouchableOpacity
              onPress={handleClose}
              style={{
                backgroundColor: t.accent,
                borderRadius: 18,
                paddingVertical: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Ionicons name="refresh-outline" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
                Scanner suivant
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </Animated.View>
    </>
  );
});

// ─── Section header helper ────────────────────────────────────────────────────
const SectionHeader = memo(function SectionHeader({
  icon,
  label,
}: {
  icon: 'child' | 'collector' | 'parent';
  label: string;
}) {
  const t = useTheme();
  const cfg = {
    child: {
      bg: t.primaryBg,
      iconName: 'person-outline' as const,
      color: t.primary,
    },
    collector: {
      bg: t.accentBg,
      iconName: 'people-outline' as const,
      color: t.accent,
    },
    parent: {
      bg: t.primaryBg,
      iconName: 'home-outline' as const,
      color: t.primary,
    },
  };
  const { bg, iconName, color } = cfg[icon];
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 14,
      }}
    >
      <View
        style={{
          width: 26,
          height: 26,
          borderRadius: 8,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={iconName} size={14} color={color} />
      </View>
      <Text style={{ color: t.text, fontSize: 14, fontWeight: '700' }}>
        {label}
      </Text>
    </View>
  );
});

// ─── Main scanner screen ──────────────────────────────────────────────────────
export default function ScannerScreen() {
  const insets = useSafeAreaInsets();
  const t = useTheme();
  const session = useSession();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [result, setResult] = useState<QrScanResult | null>(null);
  const lastScannedRef = useRef<string>('');
  const cooldownRef = useRef(false);

  const { data: school } = useMySchool();
  const schoolId = school?.id ?? '';
  const scannerUserId = session?.user.id ?? '';
  const validateQr = useValidateQr(schoolId);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission, requestPermission]);

  const handleBarCodeScanned = useCallback(
    async ({ data }: { data: string }) => {
      if (
        cooldownRef.current ||
        !data ||
        data === lastScannedRef.current ||
        !schoolId
      )
        return;
      cooldownRef.current = true;
      lastScannedRef.current = data;
      setScanState('scanning');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (__DEV__)
        console.log('[Scanner] qr scanned:', data.slice(0, 20) + '…');

      try {
        const res = await validateQr.mutateAsync(data);
        const withTimestamp: QrScanResult = {
          ...res,
          scanned_at: new Date().toISOString(),
        };
        setResult(withTimestamp);
        setScanState('result');
        if (res.success) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          if (__DEV__)
            console.log(
              '[Scanner] pickup validated — child:',
              res.child?.first_name,
              '| collector:',
              res.guardian?.first_name
            );
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          if (__DEV__)
            console.log('[Scanner] access refused:', res.refusal_reason);
        }
      } catch (e: any) {
        if (__DEV__) console.error('[Scanner] server error:', e?.message ?? e);
        setResult({
          success: false,
          refusal_reason: 'Erreur serveur. Réessayez.',
          scanned_at: new Date().toISOString(),
        });
        setScanState('result');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    },
    [schoolId, validateQr]
  );

  const handleReset = useCallback(() => {
    setResult(null);
    setScanState('idle');
    lastScannedRef.current = '';
    setTimeout(() => {
      cooldownRef.current = false;
    }, 600);
  }, []);

  // ── Permission states ──
  if (!permission) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: t.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={t.accent} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: t.bg,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 36,
          gap: 16,
        }}
      >
        <Ionicons name="warning-outline" size={52} color={t.amber} />
        <Text
          style={{
            color: t.text,
            fontSize: 20,
            fontWeight: '800',
            textAlign: 'center',
          }}
        >
          Caméra requise
        </Text>
        <Text
          style={{
            color: t.textSecondary,
            fontSize: 14,
            textAlign: 'center',
            lineHeight: 22,
          }}
        >
          L'accès à la caméra est nécessaire pour scanner les QR codes de
          récupération.
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          style={{
            backgroundColor: t.accent,
            borderRadius: 16,
            paddingVertical: 14,
            paddingHorizontal: 32,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
            Autoriser la caméra
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {/* Camera — always mounted, hidden when showing result */}
      <CameraView
        style={{ flex: 1 }}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={
          scanState === 'idle' ? handleBarCodeScanned : undefined
        }
      >
        {/* Top bar with notifications */}
        <View
          style={{
            position: 'absolute',
            top: insets.top + 12,
            left: 20,
            right: 20,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text
            style={{
              color: '#fff',
              fontSize: 17,
              fontWeight: '800',
              textShadowColor: 'rgba(0,0,0,0.5)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 4,
            }}
          >
            {school?.name ?? 'Scanner'}
          </Text>
          <View
            style={{
              backgroundColor: 'rgba(0,0,0,0.35)',
              borderRadius: 12,
              padding: 4,
            }}
          >
            <NotificationBell />
          </View>
        </View>

        {/* Viewfinder */}
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          {scanState !== 'result' && (
            <>
              <Text
                style={{
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: 15,
                  fontWeight: '600',
                  marginBottom: 32,
                  textShadowColor: 'rgba(0,0,0,0.5)',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 4,
                }}
              >
                Pointez sur le QR Code
              </Text>

              <View style={{ position: 'relative', width: 240, height: 240 }}>
                {/* Dim border */}
                <View
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.2)',
                  }}
                />

                {/* Corners */}
                <Corner position="top-left" active={scanState === 'idle'} />
                <Corner position="top-right" active={scanState === 'idle'} />
                <Corner position="bottom-left" active={scanState === 'idle'} />
                <Corner position="bottom-right" active={scanState === 'idle'} />

                {/* Beam (idle only) */}
                {scanState === 'idle' && <ScanBeam />}

                {/* Scanning spinner */}
                {scanState === 'scanning' && (
                  <Animated.View
                    entering={FadeIn.duration(200)}
                    exiting={FadeOut.duration(150)}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: 18,
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 10,
                    }}
                  >
                    <ActivityIndicator color="#fff" size="large" />
                    <Text
                      style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}
                    >
                      Validation…
                    </Text>
                  </Animated.View>
                )}
              </View>

              <Text
                style={{
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: 13,
                  marginTop: 28,
                  textAlign: 'center',
                  paddingHorizontal: 40,
                }}
              >
                Le scan est automatique dès détection
              </Text>
            </>
          )}
        </View>
      </CameraView>

      {/* Result sheet — overlaid above camera, no Modal */}
      {scanState === 'result' && result && (
        <Animated.View
          entering={FadeIn.duration(100)}
          style={{ position: 'absolute', inset: 0 }}
        >
          <ResultSheet result={result} onReset={handleReset} />
        </Animated.View>
      )}
    </View>
  );
}
