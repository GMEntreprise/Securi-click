import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  useColorScheme,
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
import {
  QrCode,
  Lock,
  RefreshCw,
  CheckCircle,
  User,
  ShieldCheck,
} from 'lucide-react-native';

const mockQR = {
  childName: 'Emma',
  code: 'SC-EMMA-001',
  validUntil: '2025-12-31',
  isActive: true,
};

const mockScans = [
  {
    id: '1',
    collectorName: 'Jean Dupont',
    time: '14:30',
    date: "Aujourd'hui",
    location: 'École Saint-Exupéry',
  },
  {
    id: '2',
    collectorName: 'Marie Martin',
    time: '08:15',
    date: 'Hier',
    location: 'Portail principal',
  },
];

function useTheme() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  return {
    dark,
    bg: dark ? '#0f0f0f' : '#f9f5f0',
    card: dark ? '#1a1a1a' : '#ffffff',
    cardBorder: dark ? '#2a2a2a' : '#f0ede8',
    text: dark ? '#f9fafb' : '#111827',
    textSecondary: dark ? '#9ca3af' : '#6b7280',
    textMuted: dark ? '#6b7280' : '#9ca3af',
    accent: dark ? '#3b82f6' : '#f97316',
    accentBg: dark ? 'rgba(59,130,246,0.12)' : 'rgba(249,115,22,0.1)',
    primary: '#1e3a8a',
    separator: dark ? '#2a2a2a' : '#f0ede8',
  };
}

export default function QRScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [unlocked, setUnlocked] = useState(false);
  const [generating, setGenerating] = useState(false);

  const qrScale = useSharedValue(1);
  const qrRotate = useSharedValue(0);
  const qrStyle = useAnimatedStyle(() => ({
    transform: [{ scale: qrScale.value }, { rotate: `${qrRotate.value}deg` }],
  }));

  const handleBiometric = useCallback(async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authentifiez-vous pour accéder au QR',
        cancelLabel: 'Annuler',
      });
      if (result.success) {
        setUnlocked(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch {
      Alert.alert('Erreur', 'Authentification indisponible sur cet appareil.');
      setUnlocked(true);
    }
  }, []);

  const handleRegenerate = useCallback(() => {
    if (!unlocked) {
      handleBiometric();
      return;
    }
    setGenerating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    qrScale.value = withSpring(0.92, { damping: 10 });
    qrRotate.value = withSequence(
      withTiming(8, { duration: 120 }),
      withTiming(-8, { duration: 120 }),
      withTiming(0, { duration: 120 })
    );
    setTimeout(() => {
      qrScale.value = withSpring(1);
      setGenerating(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 1400);
  }, [unlocked, handleBiometric, qrScale, qrRotate]);

  const daysLeft = Math.ceil(
    (new Date(mockQR.validUntil).getTime() - Date.now()) / 86400000
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <View
        style={{
          paddingTop: insets.top + 20,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 100,
        }}
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={{ alignItems: 'center', marginBottom: 32 }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: theme.accentBg,
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 20,
              marginBottom: 16,
            }}
          >
            <ShieldCheck size={13} color={theme.accent} strokeWidth={2.5} />
            <Text
              style={{
                color: theme.accent,
                fontSize: 11,
                fontWeight: '700',
                letterSpacing: 1.2,
                textTransform: 'uppercase',
              }}
            >
              QR Code sécurisé
            </Text>
          </View>
          <Text
            style={{
              color: theme.text,
              fontSize: 26,
              fontWeight: '800',
              letterSpacing: -0.5,
            }}
          >
            {mockQR.childName}
          </Text>
          <Text style={{ color: theme.textMuted, fontSize: 13, marginTop: 4 }}>
            {mockQR.code}
          </Text>
        </Animated.View>

        {/* QR card */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={{ alignItems: 'center', marginBottom: 28 }}
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
                borderColor: unlocked
                  ? 'rgba(16,185,129,0.4)'
                  : theme.cardBorder,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: unlocked ? '#10b981' : '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: unlocked ? 0.2 : 0.06,
                shadowRadius: unlocked ? 24 : 12,
                elevation: unlocked ? 12 : 4,
              },
            ]}
          >
            {unlocked ? (
              <View style={{ alignItems: 'center' }}>
                <QrCode size={130} color={theme.primary} strokeWidth={1.5} />
                <Text
                  style={{
                    color: theme.textMuted,
                    fontSize: 11,
                    fontWeight: '700',
                    letterSpacing: 0.5,
                    marginTop: 8,
                  }}
                >
                  {mockQR.code}
                </Text>
              </View>
            ) : (
              <View style={{ alignItems: 'center', gap: 10 }}>
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 22,
                    backgroundColor: theme.dark ? '#2a2a2a' : '#f3f4f6',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Lock size={28} color={theme.textMuted} />
                </View>
                <Text
                  style={{
                    color: theme.textSecondary,
                    fontSize: 14,
                    fontWeight: '600',
                  }}
                >
                  Verrouillé
                </Text>
                <Text
                  style={{
                    color: theme.textMuted,
                    fontSize: 12,
                    textAlign: 'center',
                    paddingHorizontal: 20,
                  }}
                >
                  Authentifiez-vous pour afficher
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Status badge */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              marginTop: 16,
              backgroundColor: 'rgba(16,185,129,0.12)',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
            }}
          >
            <CheckCircle size={13} color="#10b981" strokeWidth={2.5} />
            <Text style={{ color: '#10b981', fontSize: 12, fontWeight: '700' }}>
              Actif · {daysLeft} jours restants
            </Text>
          </View>
        </Animated.View>

        {/* Action buttons */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          style={{ gap: 10, marginBottom: 32 }}
        >
          <TouchableOpacity
            onPress={handleRegenerate}
            disabled={generating}
            style={{
              backgroundColor: unlocked
                ? theme.accent
                : theme.dark
                  ? '#2a2a2a'
                  : '#f3f4f6',
              borderRadius: 18,
              paddingVertical: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {generating ? (
              <RefreshCw
                size={18}
                color={unlocked ? '#fff' : theme.textMuted}
                strokeWidth={2.5}
              />
            ) : unlocked ? (
              <RefreshCw size={18} color="#fff" strokeWidth={2.5} />
            ) : (
              <Lock size={18} color={theme.textMuted} strokeWidth={2.5} />
            )}
            <Text
              style={{
                color: unlocked ? '#fff' : theme.textMuted,
                fontWeight: '700',
                fontSize: 15,
              }}
            >
              {generating
                ? 'Génération...'
                : unlocked
                  ? 'Régénérer le QR'
                  : 'Déverrouiller'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Recent scans */}
        <Animated.View entering={FadeInDown.delay(280).duration(400)}>
          <Text
            style={{
              color: theme.text,
              fontSize: 17,
              fontWeight: '700',
              marginBottom: 12,
            }}
          >
            Scans récents
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
            {mockScans.map((scan, i) => (
              <View
                key={scan.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 14,
                  borderBottomWidth: i < mockScans.length - 1 ? 1 : 0,
                  borderBottomColor: theme.separator,
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    backgroundColor: 'rgba(30,58,138,0.1)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  <User size={16} color="#1e3a8a" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: theme.text,
                      fontWeight: '600',
                      fontSize: 14,
                    }}
                  >
                    {scan.collectorName}
                  </Text>
                  <Text
                    style={{
                      color: theme.textMuted,
                      fontSize: 12,
                      marginTop: 1,
                    }}
                  >
                    {scan.location} · {scan.date} à {scan.time}
                  </Text>
                </View>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#10b981',
                  }}
                />
              </View>
            ))}
          </View>
        </Animated.View>
      </View>
    </View>
  );
}
