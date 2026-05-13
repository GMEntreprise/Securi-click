import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/theme';
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
  ChevronDown,
  XCircle,
  MinusCircle,
} from 'lucide-react-native';
import { useChildren } from '@/features/parent/hooks/useChildren';
import {
  useActiveQrCodes,
  useRecentScans,
  useGenerateQrCode,
} from '@/features/parent/hooks/useQr';

const STATUS_CFG = {
  completed: { Icon: CheckCircle, color: '#10b981', label: 'Validé' },
  denied: { Icon: XCircle, color: '#ef4444', label: 'Refusé' },
  cancelled: { Icon: MinusCircle, color: '#f59e0b', label: 'Annulé' },
} as const;

export default function QRScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [unlocked, setUnlocked] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [showChildPicker, setShowChildPicker] = useState(false);

  const qrScale = useSharedValue(1);
  const qrRotate = useSharedValue(0);
  const qrStyle = useAnimatedStyle(() => ({
    transform: [{ scale: qrScale.value }, { rotate: `${qrRotate.value}deg` }],
  }));

  const { data: children, isLoading: childrenLoading } = useChildren();
  const activeChild = useMemo(
    () =>
      selectedChildId
        ? children?.find(c => c.id === selectedChildId)
        : children?.[0],
    [children, selectedChildId]
  );

  const { data: qrCodes, isLoading: qrLoading } = useActiveQrCodes(
    activeChild?.id
  );
  const { data: recentScans, isLoading: scansLoading } = useRecentScans(
    activeChild?.id
  );
  const generateMutation = useGenerateQrCode();

  const activeQr = qrCodes?.[0] ?? null;

  const daysLeft = activeQr
    ? Math.max(
        0,
        Math.ceil(
          (new Date(activeQr.expires_at).getTime() - Date.now()) / 86400000
        )
      )
    : 0;

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

  const handleGenerate = useCallback(() => {
    if (!activeChild) return;
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
      { childId: activeChild.id },
      {
        onSuccess: () => {
          qrScale.value = withSpring(1);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
        onError: () => {
          qrScale.value = withSpring(1);
          Alert.alert('Erreur', 'Impossible de générer le QR code.');
        },
      }
    );
  }, [
    activeChild,
    unlocked,
    handleBiometric,
    qrScale,
    qrRotate,
    generateMutation,
  ]);

  const isGenerating = generateMutation.isPending;
  const isLoading = childrenLoading || qrLoading;

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
      {/* Header */}
      <Animated.View
        entering={FadeInDown.duration(400)}
        style={{ alignItems: 'center', marginBottom: 24 }}
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

        {/* Child selector */}
        {children && children.length > 1 ? (
          <TouchableOpacity
            onPress={() => setShowChildPicker(v => !v)}
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
              {activeChild
                ? `${activeChild.first_name} ${activeChild.last_name}`
                : 'Choisir un enfant'}
            </Text>
            <ChevronDown size={16} color={theme.textMuted} />
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
            {isLoading
              ? '…'
              : activeChild
                ? `${activeChild.first_name} ${activeChild.last_name}`
                : 'Aucun enfant'}
          </Text>
        )}

        {/* Child picker dropdown */}
        {showChildPicker && children && (
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
            {children.map(child => (
              <TouchableOpacity
                key={child.id}
                onPress={() => {
                  setSelectedChildId(child.id);
                  setShowChildPicker(false);
                  setUnlocked(false);
                }}
                style={{
                  padding: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.separator,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    backgroundColor: theme.accentBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <User size={15} color={theme.accent} />
                </View>
                <Text
                  style={{ color: theme.text, fontWeight: '600', fontSize: 14 }}
                >
                  {child.first_name} {child.last_name}
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}

        {activeQr && (
          <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>
            {activeQr.token}
          </Text>
        )}
      </Animated.View>

      {/* QR card */}
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
                unlocked && activeQr
                  ? 'rgba(16,185,129,0.4)'
                  : theme.cardBorder,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: unlocked && activeQr ? '#10b981' : '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: unlocked && activeQr ? 0.2 : 0.06,
              shadowRadius: unlocked && activeQr ? 24 : 12,
              elevation: unlocked && activeQr ? 12 : 4,
            },
          ]}
        >
          {isLoading ? (
            <ActivityIndicator color={theme.accent} />
          ) : !activeChild ? (
            <View
              style={{ alignItems: 'center', gap: 10, paddingHorizontal: 20 }}
            >
              <User size={32} color={theme.textMuted} strokeWidth={1.5} />
              <Text
                style={{
                  color: theme.textMuted,
                  fontSize: 13,
                  textAlign: 'center',
                }}
              >
                Ajoutez un enfant pour générer un QR code
              </Text>
            </View>
          ) : unlocked && activeQr ? (
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
                {activeQr.token}
              </Text>
            </View>
          ) : (
            <View style={{ alignItems: 'center', gap: 10 }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 22,
                  backgroundColor: theme.isDark ? '#21262d' : '#f3f4f6',
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
                {activeQr ? 'Verrouillé' : 'Aucun QR actif'}
              </Text>
              {!activeQr && (
                <Text
                  style={{
                    color: theme.textMuted,
                    fontSize: 12,
                    textAlign: 'center',
                    paddingHorizontal: 20,
                  }}
                >
                  Générez un QR code pour ce collecteur
                </Text>
              )}
            </View>
          )}
        </Animated.View>

        {/* Status badge */}
        {activeQr && (
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
              Actif · {daysLeft} jour{daysLeft !== 1 ? 's' : ''} restant
              {daysLeft !== 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </Animated.View>

      {/* Action button */}
      {activeChild && (
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          style={{ marginBottom: 32 }}
        >
          <TouchableOpacity
            onPress={handleGenerate}
            disabled={isGenerating || !activeChild}
            style={{
              backgroundColor: unlocked
                ? theme.accent
                : theme.isDark
                  ? '#21262d'
                  : '#f3f4f6',
              borderRadius: 18,
              paddingVertical: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: isGenerating ? 0.7 : 1,
            }}
          >
            {isGenerating ? (
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
              {isGenerating
                ? 'Génération...'
                : unlocked
                  ? activeQr
                    ? 'Régénérer le QR'
                    : 'Générer un QR'
                  : 'Déverrouiller'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

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
          {scansLoading ? (
            <ActivityIndicator color={theme.accent} style={{ padding: 24 }} />
          ) : !recentScans || recentScans.length === 0 ? (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <Text style={{ color: theme.textMuted, fontSize: 14 }}>
                Aucun scan récent
              </Text>
            </View>
          ) : (
            recentScans.map((scan, i) => {
              const cfg = STATUS_CFG[scan.status] ?? STATUS_CFG.completed;
              const { Icon } = cfg;
              const guardianName = scan.guardian
                ? `${scan.guardian.first_name} ${scan.guardian.last_name}`
                : 'Inconnu';
              const d = new Date(scan.pickup_time);
              const timeStr = d.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              });
              const dateStr = d.toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
              });

              return (
                <View
                  key={scan.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 14,
                    borderBottomWidth: i < recentScans.length - 1 ? 1 : 0,
                    borderBottomColor: theme.separator,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      backgroundColor: `${cfg.color}20`,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}
                  >
                    <Icon size={16} color={cfg.color} strokeWidth={2.5} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: theme.text,
                        fontWeight: '600',
                        fontSize: 14,
                      }}
                    >
                      {guardianName}
                    </Text>
                    {scan.guardian?.relationship ? (
                      <Text
                        style={{
                          color: theme.textMuted,
                          fontSize: 11,
                          marginTop: 1,
                        }}
                      >
                        {scan.guardian.relationship} · {dateStr} à {timeStr}
                      </Text>
                    ) : (
                      <Text
                        style={{
                          color: theme.textMuted,
                          fontSize: 11,
                          marginTop: 1,
                        }}
                      >
                        {dateStr} à {timeStr}
                      </Text>
                    )}
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
                      {cfg.label}
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
