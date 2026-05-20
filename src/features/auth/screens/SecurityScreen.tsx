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
import { CheckCircle, Fingerprint, Shield, ShieldOff, Smartphone, XCircle } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { useLocalSecurity } from '../hooks/useLocalSecurity';

const TYPE_LABEL: Record<string, string> = {
  facial: 'Face ID',
  fingerprint: 'Empreinte digitale',
  iris: 'Iris',
  none: 'Biométrie',
};

export function SecurityScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { capability, isEnabled, isLoading, isMutating, enable, disable, test } =
    useLocalSecurity();

  const [testResult, setTestResult] = useState<'idle' | 'success' | 'failed'>('idle');

  const biometricLabel = TYPE_LABEL[capability?.type ?? 'none'];

  const handleEnable = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await enable();
    if (result === 'success') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (result === 'unavailable') {
      Alert.alert(
        'Non disponible',
        'Votre appareil ne prend pas en charge la biométrie ou aucun moyen biométrique n\'est enregistré.',
      );
    }
  }, [enable]);

  const handleDisable = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Désactiver la protection',
      'Voulez-vous vraiment désactiver la protection biométrique ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Désactiver',
          style: 'destructive',
          onPress: async () => {
            const result = await disable();
            if (result === 'success') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          },
        },
      ],
    );
  }, [disable]);

  const handleTest = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTestResult('idle');
    const ok = await test();
    setTestResult(ok ? 'success' : 'failed');
    Haptics.notificationAsync(
      ok
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Error,
    );
    setTimeout(() => setTestResult('idle'), 3000);
  }, [test]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}>
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
            {isEnabled
              ? <Shield size={28} color="#fff" strokeWidth={2} />
              : <ShieldOff size={28} color={theme.textMuted} strokeWidth={2} />}
          </View>
          <Text style={{ fontSize: 18, fontWeight: '800', color: theme.text, marginBottom: 6 }}>
            {isEnabled ? 'Accès sécurisé activé' : 'Protection désactivée'}
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
              ? `Votre compte est protégé par ${biometricLabel.toLowerCase()}.`
              : 'Activez la biométrie pour protéger l\'accès à votre compte.'}
          </Text>
        </View>
      </Animated.View>

      {/* Compatibilité appareil */}
      <Animated.View entering={FadeInDown.delay(60).duration(350)} style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>
          Votre appareil
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
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 }}>
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
              {canUseBiometric
                ? <Fingerprint size={20} color={theme.green} strokeWidth={2} />
                : <Smartphone size={20} color={theme.textMuted} strokeWidth={2} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }}>
                {canUseBiometric ? biometricLabel : 'Biométrie'}
              </Text>
              <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>
                {!capability?.isAvailable
                  ? 'Non pris en charge par cet appareil'
                  : !capability.isEnrolled
                    ? 'Aucun moyen biométrique enregistré dans les réglages'
                    : 'Disponible et prêt à l\'emploi'}
              </Text>
            </View>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: canUseBiometric ? theme.green : theme.textMuted,
              }}
            />
          </View>
        </View>
      </Animated.View>

      {/* Actions */}
      <Animated.View entering={FadeInDown.delay(120).duration(350)} style={{ gap: 12 }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textMuted, marginBottom: 0, textTransform: 'uppercase', letterSpacing: 0.8 }}>
          Actions
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
            {isMutating
              ? <ActivityIndicator color="#fff" size="small" />
              : <Shield size={22} color={canUseBiometric ? '#fff' : theme.textMuted} strokeWidth={2} />}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: canUseBiometric ? '#fff' : theme.textMuted }}>
                Activer la biométrie
              </Text>
              <Text style={{ fontSize: 12, color: canUseBiometric ? 'rgba(255,255,255,0.75)' : theme.textMuted, marginTop: 2 }}>
                {canUseBiometric
                  ? 'Une confirmation biométrique sera demandée'
                  : 'Disponible uniquement si la biométrie est configurée dans les réglages'}
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
              {testResult === 'success'
                ? <CheckCircle size={22} color={theme.green} strokeWidth={2} />
                : testResult === 'failed'
                  ? <XCircle size={22} color={theme.red} strokeWidth={2} />
                  : <Fingerprint size={22} color={theme.accent} strokeWidth={2} />}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }}>
                  Tester la protection
                </Text>
                <Text style={{ fontSize: 12, color: testResult === 'success' ? theme.green : testResult === 'failed' ? theme.red : theme.textMuted, marginTop: 2 }}>
                  {testResult === 'success'
                    ? 'Authentification réussie'
                    : testResult === 'failed'
                      ? 'Authentification échouée'
                      : 'Vérifier que votre biométrie fonctionne'}
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
              {isMutating
                ? <ActivityIndicator color={theme.red} size="small" />
                : <ShieldOff size={22} color={theme.red} strokeWidth={2} />}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: theme.red }}>
                  Désactiver la biométrie
                </Text>
                <Text style={{ fontSize: 12, color: theme.red, opacity: 0.7, marginTop: 2 }}>
                  Vous pouvez la réactiver à tout moment
                </Text>
              </View>
            </TouchableOpacity>
          </>
        )}
      </Animated.View>

      {/* Info bas de page */}
      <Animated.View entering={FadeInDown.delay(180).duration(350)} style={{ marginTop: 28 }}>
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
          <Shield size={16} color={theme.accent} strokeWidth={2} style={{ marginTop: 1 }} />
          <Text style={{ flex: 1, fontSize: 12, color: theme.accent, lineHeight: 18 }}>
            La biométrie ne remplace pas votre mot de passe. Votre session reste active — seul l'accès local à l'app est protégé.
          </Text>
        </View>
      </Animated.View>
    </ScrollView>
  );
}
