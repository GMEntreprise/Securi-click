import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { CameraView, useCameraPermissions } from 'expo-camera';
import {
  CheckCircle2,
  XCircle,
  ScanLine,
  Phone,
  User,
  GraduationCap,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react-native';
import { useTheme } from '@/theme';
import { useMySchool } from '@/features/school/hooks/useSchool';
import { useValidateQr } from '@/features/school/hooks/useValidations';
import { Avatar } from '@/shared/ui/base/avatar';
import type { QrScanResult } from '@/features/school/types';

type ScanState = 'idle' | 'scanning' | 'result';

export default function ScannerScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [result, setResult] = useState<QrScanResult | null>(null);
  const lastScannedRef = useRef<string>('');
  const cooldownRef = useRef(false);

  const { data: school } = useMySchool();
  const schoolId = school?.id ?? '';
  const validateQr = useValidateQr(schoolId);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleBarCodeScanned = useCallback(
    async ({ data }: { data: string }) => {
      if (cooldownRef.current || !data || data === lastScannedRef.current)
        return;
      if (!schoolId) return;
      cooldownRef.current = true;
      lastScannedRef.current = data;
      setScanState('scanning');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      try {
        const res = await validateQr.mutateAsync(data);
        setResult(res);
        setScanState('result');
        if (res.success) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      } catch {
        setResult({
          success: false,
          refusal_reason: 'Erreur serveur. Réessayez.',
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
    }, 800);
  }, []);

  if (!permission) {
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

  if (!permission.granted) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.bg,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 32,
        }}
      >
        <AlertTriangle size={48} color={theme.amber} strokeWidth={1.5} />
        <Text
          style={{
            color: theme.text,
            fontSize: 18,
            fontWeight: '700',
            marginTop: 16,
            textAlign: 'center',
          }}
        >
          Caméra requise
        </Text>
        <Text
          style={{
            color: theme.textSecondary,
            fontSize: 14,
            textAlign: 'center',
            marginTop: 8,
            lineHeight: 20,
          }}
        >
          L'accès à la caméra est nécessaire pour scanner les QR codes.
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          style={{
            marginTop: 24,
            backgroundColor: theme.accent,
            borderRadius: 14,
            paddingVertical: 14,
            paddingHorizontal: 28,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
            Autoriser la caméra
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {scanState !== 'result' && (
        <CameraView
          style={{ flex: 1 }}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={
            scanState === 'idle' ? handleBarCodeScanned : undefined
          }
        >
          {/* Overlay */}
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingTop: insets.top,
            }}
          >
            <Text
              style={{
                color: '#fff',
                fontSize: 17,
                fontWeight: '700',
                marginBottom: 32,
                textShadowColor: 'rgba(0,0,0,0.6)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 4,
              }}
            >
              Pointez sur le QR Code
            </Text>

            {/* Viewfinder */}
            <View style={{ position: 'relative', width: 240, height: 240 }}>
              <View
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 20,
                  borderWidth: 2,
                  borderColor: 'rgba(255,255,255,0.3)',
                }}
              />
              <Corner position="top-left" />
              <Corner position="top-right" />
              <Corner position="bottom-left" />
              <Corner position="bottom-right" />
              {scanState === 'scanning' && (
                <Animated.View
                  entering={FadeIn}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 18,
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ActivityIndicator color="#fff" size="large" />
                  <Text
                    style={{
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: '600',
                      marginTop: 10,
                    }}
                  >
                    Validation…
                  </Text>
                </Animated.View>
              )}
            </View>

            <Text
              style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: 13,
                marginTop: 28,
                textAlign: 'center',
                paddingHorizontal: 40,
              }}
            >
              Le scan est automatique dès détection
            </Text>
          </View>
        </CameraView>
      )}

      {/* Result modal */}
      <Modal
        visible={scanState === 'result'}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleReset}
      >
        {result && <ScanResultSheet result={result} onReset={handleReset} />}
      </Modal>
    </View>
  );
}

const Corner = memo(function Corner({
  position,
}: {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}) {
  const isTop = position.startsWith('top');
  const isLeft = position.endsWith('left');
  return (
    <View
      style={{
        position: 'absolute',
        top: isTop ? 0 : undefined,
        bottom: isTop ? undefined : 0,
        left: isLeft ? 0 : undefined,
        right: isLeft ? undefined : 0,
        width: 28,
        height: 28,
        borderTopWidth: isTop ? 3 : 0,
        borderBottomWidth: isTop ? 0 : 3,
        borderLeftWidth: isLeft ? 3 : 0,
        borderRightWidth: isLeft ? 0 : 3,
        borderColor: '#fff',
        borderTopLeftRadius: isTop && isLeft ? 10 : 0,
        borderTopRightRadius: isTop && !isLeft ? 10 : 0,
        borderBottomLeftRadius: !isTop && isLeft ? 10 : 0,
        borderBottomRightRadius: !isTop && !isLeft ? 10 : 0,
      }}
    />
  );
});

const ScanResultSheet = memo(function ScanResultSheet({
  result,
  onReset,
}: {
  result: QrScanResult;
  onReset: () => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const isSuccess = result.success;
  const color = isSuccess ? theme.green : theme.red;
  const bg = isSuccess ? theme.greenBg : theme.redBg;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Handle */}
      <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
        <View
          style={{
            width: 40,
            height: 4,
            borderRadius: 2,
            backgroundColor: theme.inputBorder,
          }}
        />
      </View>

      {/* Status banner */}
      <Animated.View
        entering={FadeInDown.duration(300)}
        style={{
          margin: 20,
          padding: 20,
          borderRadius: 22,
          backgroundColor: bg,
          alignItems: 'center',
          gap: 10,
        }}
      >
        {isSuccess ? (
          <CheckCircle2 size={48} color={color} strokeWidth={1.8} />
        ) : (
          <XCircle size={48} color={color} strokeWidth={1.8} />
        )}
        <Text
          style={{
            color,
            fontSize: 22,
            fontWeight: '800',
            textAlign: 'center',
          }}
        >
          {isSuccess ? 'Validation réussie' : 'Accès refusé'}
        </Text>
        {!isSuccess && result.refusal_reason && (
          <Text
            style={{
              color,
              fontSize: 14,
              textAlign: 'center',
              opacity: 0.85,
              lineHeight: 20,
            }}
          >
            {result.refusal_reason}
          </Text>
        )}
      </Animated.View>

      {/* Child info */}
      {result.child && (
        <Animated.View
          entering={FadeInDown.delay(60).duration(300)}
          style={{
            marginHorizontal: 20,
            marginBottom: 16,
            backgroundColor: theme.card,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: theme.cardBorder,
            padding: 16,
          }}
        >
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
                backgroundColor: theme.primaryBg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <User size={13} color={theme.primary} />
            </View>
            <Text
              style={{ color: theme.text, fontSize: 14, fontWeight: '700' }}
            >
              Enfant
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Avatar
              image={{
                uri: result.child.photo_url ?? '',
                name: `${result.child.first_name} ${result.child.last_name}`,
              }}
              size={64}
              showBorder={false}
              backgroundColor={theme.primaryBg}
              textColor={theme.primary}
            />
            <View>
              <Text
                style={{ color: theme.text, fontSize: 17, fontWeight: '800' }}
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
                  <GraduationCap size={13} color={theme.textMuted} />
                  <Text style={{ color: theme.textMuted, fontSize: 13 }}>
                    {result.child.class_name}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Animated.View>
      )}

      {/* Guardian info */}
      {result.guardian && (
        <Animated.View
          entering={FadeInDown.delay(100).duration(300)}
          style={{
            marginHorizontal: 20,
            marginBottom: 16,
            backgroundColor: theme.card,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: theme.cardBorder,
            padding: 16,
          }}
        >
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
                backgroundColor: theme.accentBg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <User size={13} color={theme.accent} />
            </View>
            <Text
              style={{ color: theme.text, fontSize: 14, fontWeight: '700' }}
            >
              Collecteur
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Avatar
              image={{
                uri: result.guardian.photo_url ?? '',
                name: `${result.guardian.first_name} ${result.guardian.last_name}`,
              }}
              size={64}
              showBorder={false}
              backgroundColor={theme.accentBg}
              textColor={theme.accent}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{ color: theme.text, fontSize: 17, fontWeight: '800' }}
              >
                {result.guardian.first_name} {result.guardian.last_name}
              </Text>
              <Text
                style={{ color: theme.textMuted, fontSize: 13, marginTop: 2 }}
              >
                {result.guardian.relationship}
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  marginTop: 4,
                }}
              >
                <Phone size={13} color={theme.textMuted} />
                <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                  {result.guardian.phone}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Reset CTA */}
      <Animated.View
        entering={FadeInDown.delay(140).duration(300)}
        style={{ marginHorizontal: 20, marginTop: 8 }}
      >
        <TouchableOpacity
          onPress={onReset}
          style={{
            backgroundColor: theme.accent,
            borderRadius: 18,
            paddingVertical: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <RotateCcw size={18} color="#fff" strokeWidth={2.5} />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
            Scanner suivant
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
});
