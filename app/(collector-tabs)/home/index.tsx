import React, { useCallback, useMemo, useState, useRef } from 'react';
import { TouchableOpacity, View, Text, ScrollView, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTabBarHeight } from '@/hooks/useTabBarHeight';
import { useAppNavigation } from '@/navigation/useAppNavigation';
import {
  ShieldCheck,
  ShieldOff,
  Clock,
  CheckCircle,
  XCircle,
  MinusCircle,
  AlertTriangle,
  UserPlus,
  TrendingUp,
  CalendarDays,
  QrCode,
  TriangleAlert,
  MapPin,
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
import { AccessDetailSheet } from '@/features/collector/components/ui/AccessDetailSheet';
import type { CollectorGuardian } from '@/features/collector/types';
import { QueryError } from '@/shared/ui/base/query-error';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import {
  useCollectorPickupSchedules,
  getNextPickupLabel,
  getActiveDayLabels,
  formatTimeWindows,
  isTodayAuthorized,
} from '@/features/collector/hooks/usePickupSchedule';

const STATUS_CFG = {
  completed: { Icon: CheckCircle, color: '#10b981', label: 'Validé' },
  denied: { Icon: XCircle, color: '#ef4444', label: 'Refusé' },
  cancelled: { Icon: MinusCircle, color: '#f59e0b', label: 'Annulé' },
} as const;

function StatCard({
  label,
  value,
  Icon,
  color,
  bg,
  delay,
}: {
  label: string;
  value: number | string;
  Icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
  color: string;
  bg: string;
  delay: number;
}) {
  const theme = useTheme();
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(320)}
      style={{ flex: 1 }}
    >
      <View
        style={{
          backgroundColor: theme.card,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: theme.cardBorder,
          padding: 14,
          gap: 8,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 11,
            backgroundColor: bg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={17} color={color} strokeWidth={2.5} />
        </View>
        <Text style={{ color: theme.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.5 }}>
          {value}
        </Text>
        <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '600', lineHeight: 14 }}>
          {label}
        </Text>
      </View>
    </Animated.View>
  );
}

export default function CollectorHomeScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useTabBarHeight();
  const theme = useTheme();
  const nav = useAppNavigation();
  const { data: profile } = useCollectorProfile();
  const { data: guardians, isLoading: guardiansLoading, isError: guardiansError, refetch: refetchGuardians } = useMyGuardians();
  const { data: identity } = useMyIdentity();
  const { data: logs, isLoading: logsLoading, isError: logsError, refetch: refetchLogs } = useMyPickupLogs();
  const { data: pendingInvites } = usePendingInvites();
  const { data: schedules } = useCollectorPickupSchedules();

  const hasPending = (pendingInvites?.length ?? 0) > 0;
  const [onboardVisible, setOnboardVisible] = useState(false);
  const handleOnboardDismiss = useCallback(() => setOnboardVisible(false), []);
  const [selectedGuardian, setSelectedGuardian] = useState<CollectorGuardian | null>(null);

  const activeGuardians = useMemo(
    () => (guardians ?? []).filter(g => g.is_active),
    [guardians]
  );

  const stats = useMemo(() => {
    const allLogs = logs ?? [];
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisWeek = allLogs.filter(l => new Date(l.pickup_time) >= weekAgo);
    const incidents = allLogs.filter(l => l.status === 'denied' || l.status === 'cancelled');
    return {
      total: allLogs.filter(l => l.status === 'completed').length,
      thisWeek: thisWeek.filter(l => l.status === 'completed').length,
      activeAccess: (guardians ?? []).filter(g => g.is_active).length,
      incidents: incidents.length,
    };
  }, [logs, guardians]);

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

  if (guardiansError || logsError) {
    return <QueryError onRetry={() => { refetchGuardians(); refetchLogs(); }} />;
  }

  return (
    <>
      <CollectorOnboardSheet
        visible={onboardVisible}
        onDismiss={handleOnboardDismiss}
      />
      <AccessDetailSheet
        guardian={selectedGuardian}
        onClose={() => setSelectedGuardian(null)}
      />
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.bg }}
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingHorizontal: 20,
          paddingBottom: tabBarHeight + 20,
        }}
        showsVerticalScrollIndicator={false}
      >
      {/* Header */}
      <Animated.View
        entering={FadeInDown.duration(400)}
        style={{ marginBottom: 24 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
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
          </View>
          <NotificationBell />
        </View>
      </Animated.View>

      {/* Stats */}
      <Animated.View
        entering={FadeInDown.delay(40).duration(350)}
        style={{ marginBottom: 16 }}
      >
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
          <StatCard
            label={'Récupérations\ntotales'}
            value={stats.total}
            Icon={TrendingUp}
            color="#10b981"
            bg="rgba(16,185,129,0.12)"
            delay={50}
          />
          <StatCard
            label={'Cette\nsemaine'}
            value={stats.thisWeek}
            Icon={CalendarDays}
            color="#3b82f6"
            bg="rgba(59,130,246,0.12)"
            delay={90}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <StatCard
            label={'Accès\nactifs'}
            value={stats.activeAccess}
            Icon={QrCode}
            color={theme.accent}
            bg={theme.accentBg}
            delay={130}
          />
          <StatCard
            label={'Incidents\n(refus/annul.)'}
            value={stats.incidents}
            Icon={TriangleAlert}
            color={stats.incidents > 0 ? '#ef4444' : theme.textMuted}
            bg={stats.incidents > 0 ? 'rgba(239,68,68,0.12)' : theme.card}
            delay={170}
          />
        </View>
      </Animated.View>

      {/* Prochain pickup */}
      {schedules && schedules.length > 0 && (
        <Animated.View
          entering={FadeInDown.delay(190).duration(350)}
          style={{ marginBottom: 14 }}
        >
          <Text style={{ color: theme.text, fontSize: 17, fontWeight: '700', marginBottom: 10 }}>
            Récupérations prévues
          </Text>
          <View style={{ gap: 10 }}>
            {schedules.slice(0, 3).map(auth => {
              const todayOk = isTodayAuthorized(auth);
              const nextLabel = getNextPickupLabel(auth);
              const days = getActiveDayLabels(auth);
              const times = formatTimeWindows(auth);
              const guardian = guardians?.find(g => g.id === auth.guardian_id);
              const childName = guardian?.child
                ? `${guardian.child.first_name} ${guardian.child.last_name}`
                : '—';
              const schoolName = guardian?.child?.school?.name ?? null;

              return (
                <View
                  key={auth.id}
                  style={{
                    backgroundColor: theme.card,
                    borderRadius: 18,
                    borderWidth: 1.5,
                    borderColor: todayOk ? 'rgba(16,185,129,0.3)' : theme.cardBorder,
                    overflow: 'hidden',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'stretch' }}>
                    <View style={{ width: 4, backgroundColor: todayOk ? theme.green : theme.cardBorder }} />
                    <View style={{ flex: 1, padding: 14, gap: 8 }}>
                      {/* Enfant + badge aujourd'hui */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={{ color: theme.text, fontWeight: '800', fontSize: 15 }}>
                          {childName}
                        </Text>
                        {todayOk && (
                          <View style={{ backgroundColor: theme.greenBg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                            <Text style={{ color: theme.green, fontSize: 11, fontWeight: '700' }}>Aujourd'hui</Text>
                          </View>
                        )}
                      </View>

                      {/* Prochain créneau */}
                      {nextLabel && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Clock size={12} color={theme.accent} strokeWidth={2.5} />
                          <Text style={{ color: theme.accent, fontSize: 13, fontWeight: '700' }}>{nextLabel}</Text>
                        </View>
                      )}

                      {/* École */}
                      {schoolName && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <MapPin size={11} color={theme.textMuted} strokeWidth={2} />
                          <Text style={{ color: theme.textMuted, fontSize: 12 }}>{schoolName}</Text>
                        </View>
                      )}

                      {/* Jours + horaires */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <CalendarDays size={11} color={theme.textMuted} strokeWidth={2} />
                        <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                          {days.join(', ')}
                        </Text>
                        <Text style={{ color: theme.textMuted, fontSize: 12 }}>·</Text>
                        <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{times}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </Animated.View>
      )}

      {/* Pending invites banner */}
      {hasPending && (
        <Animated.View
          entering={FadeInDown.delay(200).duration(350)}
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
                  ? `${pendingInvites!.length} nouvelles autorisations`
                  : 'Nouvelle autorisation disponible'}
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 1 }}>
                Appuyez pour activer votre accès
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Access status — big clear card */}
      <Animated.View
        entering={FadeInDown.delay(220).duration(350)}
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
        entering={FadeInDown.delay(260).duration(350)}
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
              onPress={() => nav.goToCollectorProfile()}
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
          entering={FadeInDown.delay(300).duration(350)}
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
              <TouchableOpacity
                key={g.id}
                activeOpacity={0.8}
                onPress={() => setSelectedGuardian(g)}
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
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      ) : null}

      {/* Recent pickups */}
      <Animated.View entering={FadeInDown.delay(340).duration(350)}>
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
