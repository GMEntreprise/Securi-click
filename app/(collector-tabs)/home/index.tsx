import React, { useCallback, useMemo, useState } from 'react';
import { TouchableOpacity, View, Text, ScrollView, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ShieldCheck,
  ShieldOff,
  Clock,
  CheckCircle,
  XCircle,
  MinusCircle,
  AlertTriangle,
  UserPlus,
} from 'lucide-react-native';
import { Avatar } from '@/shared/ui/base/avatar';
import { useTheme } from '@/theme';
import {
  useMyGuardians,
  useMyPickupLogs,
  useMyIdentity,
  useCollectorProfile,
  usePendingInvites,
} from '@/features/collector/hooks/useCollector';
import { CollectorOnboardSheet } from '@/features/collector/components/ui/CollectorOnboardSheet';

const STATUS_CFG = {
  completed: { Icon: CheckCircle, color: '#10b981', label: 'Validé' },
  denied: { Icon: XCircle, color: '#ef4444', label: 'Refusé' },
  cancelled: { Icon: MinusCircle, color: '#f59e0b', label: 'Annulé' },
} as const;

export default function CollectorHomeScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { data: profile } = useCollectorProfile();
  const { data: guardians, isLoading: guardiansLoading } = useMyGuardians();
  const { data: identity } = useMyIdentity();
  const { data: logs, isLoading: logsLoading } = useMyPickupLogs();
  const { data: pendingInvites } = usePendingInvites();

  const hasPending = (pendingInvites?.length ?? 0) > 0;
  const [onboardVisible, setOnboardVisible] = useState(false);
  const handleOnboardDismiss = useCallback(() => setOnboardVisible(false), []);

  const activeGuardians = useMemo(
    () => (guardians ?? []).filter(g => g.is_active),
    [guardians]
  );

  const hasAnyAccess = activeGuardians.length > 0;
  const identityStatus = identity?.verification_status ?? 'none';

  const identityBadge = {
    verified: {
      label: 'Identité vérifiée',
      color: '#10b981',
      bg: 'rgba(16,185,129,0.12)',
      Icon: ShieldCheck,
    },
    pending: {
      label: 'Vérification en attente',
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.12)',
      Icon: AlertTriangle,
    },
    refused: {
      label: 'Vérification refusée',
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.12)',
      Icon: ShieldOff,
    },
    expired: {
      label: 'Identité expirée',
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.12)',
      Icon: ShieldOff,
    },
    none: {
      label: 'Identité non vérifiée',
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.12)',
      Icon: AlertTriangle,
    },
  } as const;
  const badge =
    identityBadge[identityStatus as keyof typeof identityBadge] ??
    identityBadge.none;
  const BadgeIcon = badge.Icon;

  const recentLogs = (logs ?? []).slice(0, 5);

  return (
    <>
      <CollectorOnboardSheet
        visible={onboardVisible}
        onDismiss={handleOnboardDismiss}
      />
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
        style={{ marginBottom: 24 }}
      >
        <Text
          style={{
            color: theme.textMuted,
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            marginBottom: 4,
          }}
        >
          Tableau de bord
        </Text>
        <Text
          style={{
            color: theme.text,
            fontSize: 26,
            fontWeight: '800',
            letterSpacing: -0.5,
          }}
        >
          Bonjour{profile ? `, ${profile.first_name}` : ''} 👋
        </Text>
      </Animated.View>

      {/* Pending invites banner */}
      {hasPending && (
        <Animated.View
          entering={FadeInDown.delay(30).duration(350)}
          style={{ marginBottom: 14 }}
        >
          <TouchableOpacity
            onPress={() => setOnboardVisible(true)}
            activeOpacity={0.8}
            style={{
              backgroundColor: theme.accentBg,
              borderRadius: 18,
              borderWidth: 1.5,
              borderColor: 'rgba(249,115,22,0.35)',
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 13,
                backgroundColor: theme.accent,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UserPlus size={18} color="#fff" strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}>
                {(pendingInvites?.length ?? 0) > 1
                  ? `${pendingInvites!.length} invitations en attente`
                  : 'Invitation en attente'}
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 1 }}>
                Appuyez pour confirmer votre accès
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Access status — big clear card */}
      <Animated.View
        entering={FadeInDown.delay(60).duration(350)}
        style={{ marginBottom: 16 }}
      >
        <View
          style={{
            backgroundColor: hasAnyAccess
              ? 'rgba(16,185,129,0.1)'
              : 'rgba(239,68,68,0.1)',
            borderRadius: 22,
            padding: 20,
            borderWidth: 1.5,
            borderColor: hasAnyAccess
              ? 'rgba(16,185,129,0.3)'
              : 'rgba(239,68,68,0.3)',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              backgroundColor: hasAnyAccess
                ? 'rgba(16,185,129,0.2)'
                : 'rgba(239,68,68,0.2)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {hasAnyAccess ? (
              <ShieldCheck size={26} color="#10b981" strokeWidth={2} />
            ) : (
              <ShieldOff size={26} color="#ef4444" strokeWidth={2} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '800',
                color: hasAnyAccess ? '#10b981' : '#ef4444',
              }}
            >
              {hasAnyAccess ? 'Accès actif' : 'Accès suspendu'}
            </Text>
            <Text
              style={{ fontSize: 13, color: theme.textSecondary, marginTop: 2 }}
            >
              {hasAnyAccess
                ? `${activeGuardians.length} enfant${activeGuardians.length > 1 ? 's' : ''} autorisé${activeGuardians.length > 1 ? 's' : ''}`
                : 'Aucune autorisation active'}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Identity status */}
      <Animated.View
        entering={FadeInDown.delay(120).duration(350)}
        style={{ marginBottom: 16 }}
      >
        <View
          style={{
            backgroundColor: badge.bg,
            borderRadius: 16,
            padding: 14,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <BadgeIcon size={18} color={badge.color} strokeWidth={2.5} />
          <Text
            style={{
              color: badge.color,
              fontSize: 13,
              fontWeight: '700',
              flex: 1,
            }}
          >
            {badge.label}
          </Text>
          {identityStatus !== 'verified' && (
            <Text
              onPress={() => router.push('/(collector-tabs)/profile' as any)}
              style={{
                color: badge.color,
                fontSize: 12,
                fontWeight: '700',
                textDecorationLine: 'underline',
              }}
            >
              Vérifier
            </Text>
          )}
        </View>
      </Animated.View>

      {/* Authorized children */}
      {guardiansLoading ? (
        <ActivityIndicator color={theme.accent} style={{ marginTop: 20 }} />
      ) : activeGuardians.length > 0 ? (
        <Animated.View
          entering={FadeInDown.delay(180).duration(350)}
          style={{ marginBottom: 20 }}
        >
          <Text
            style={{
              color: theme.text,
              fontSize: 17,
              fontWeight: '700',
              marginBottom: 12,
            }}
          >
            Enfants autorisés
          </Text>
          <View style={{ gap: 10 }}>
            {activeGuardians.map(g => (
              <View
                key={g.id}
                style={{
                  backgroundColor: theme.card,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: theme.cardBorder,
                  padding: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <Avatar
                  image={{
                    uri: g.child?.photo_url ?? '',
                    name: `${g.child?.first_name ?? ''} ${g.child?.last_name ?? ''}`.trim(),
                  }}
                  size={44}
                  showBorder={false}
                  backgroundColor={theme.accentBg}
                  textColor={theme.accent}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: theme.text,
                      fontWeight: '700',
                      fontSize: 15,
                    }}
                  >
                    {g.child?.first_name} {g.child?.last_name}
                  </Text>
                  {g.child?.class_name ? (
                    <Text
                      style={{
                        color: theme.textMuted,
                        fontSize: 12,
                        marginTop: 1,
                      }}
                    >
                      {g.child.class_name}
                      {g.child.school ? ` · ${g.child.school.name}` : ''}
                    </Text>
                  ) : null}
                </View>
                <View
                  style={{
                    backgroundColor: 'rgba(16,185,129,0.12)',
                    borderRadius: 8,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                  }}
                >
                  <Text
                    style={{
                      color: '#10b981',
                      fontSize: 11,
                      fontWeight: '700',
                    }}
                  >
                    Autorisé
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>
      ) : null}

      {/* Recent pickups */}
      <Animated.View entering={FadeInDown.delay(240).duration(350)}>
        <Text
          style={{
            color: theme.text,
            fontSize: 17,
            fontWeight: '700',
            marginBottom: 12,
          }}
        >
          Récupérations récentes
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
          {logsLoading ? (
            <ActivityIndicator color={theme.accent} style={{ padding: 24 }} />
          ) : recentLogs.length === 0 ? (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <Clock size={32} color={theme.textMuted} strokeWidth={1.5} />
              <Text
                style={{
                  color: theme.textMuted,
                  fontSize: 14,
                  marginTop: 10,
                  fontWeight: '500',
                }}
              >
                Aucune récupération
              </Text>
            </View>
          ) : (
            recentLogs.map((log, i) => {
              const cfg = STATUS_CFG[log.status] ?? STATUS_CFG.cancelled;
              const { Icon } = cfg;
              const d = new Date(log.pickup_time);
              return (
                <View
                  key={log.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 14,
                    borderBottomWidth: i < recentLogs.length - 1 ? 1 : 0,
                    borderBottomColor: theme.separator,
                    gap: 12,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 11,
                      backgroundColor: `${cfg.color}20`,
                      alignItems: 'center',
                      justifyContent: 'center',
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
                      {log.child?.first_name} {log.child?.last_name}
                    </Text>
                    <Text
                      style={{
                        color: theme.textMuted,
                        fontSize: 12,
                        marginTop: 1,
                      }}
                    >
                      {d.toLocaleDateString('fr-FR')} à{' '}
                      {d.toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
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
    </>
  );
}
