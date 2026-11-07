import React, { useCallback, useMemo, useState } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTabBarHeight } from '@/hooks/useTabBarHeight';
import { useAppNavigation } from '@/navigation/useAppNavigation';
import { Avatar } from '@/shared/ui/base/avatar';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import {
  AppIcon,
  type AppIconName,
  type AppIconTone,
} from '@/shared/ui/icons/AppIcon';
import { appLocale } from '@/i18n/locale';
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
  completed: {
    icon: 'check',
    tone: 'green',
    color: '#10b981',
    labelKey: 'common:status_completed',
  },
  denied: {
    icon: 'cross',
    tone: 'red',
    color: '#ef4444',
    labelKey: 'common:status_denied',
  },
  cancelled: {
    icon: 'clock',
    tone: 'amber',
    color: '#f59e0b',
    labelKey: 'common:status_cancelled',
  },
} as const satisfies Record<
  string,
  { icon: AppIconName; tone: AppIconTone; color: string; labelKey: string }
>;

function StatCard({
  label,
  value,
  icon,
  tone,
  delay,
}: {
  label: string;
  value: number | string;
  icon: AppIconName;
  tone: AppIconTone;
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
        <AppIcon name={icon} tone={tone} size={40} />
        <Text
          style={{
            color: theme.text,
            fontSize: 22,
            fontWeight: '800',
            letterSpacing: -0.5,
          }}
        >
          {value}
        </Text>
        <Text
          style={{
            color: theme.textMuted,
            fontSize: 11,
            fontWeight: '600',
            lineHeight: 14,
          }}
        >
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
  const { t } = useTranslation('collector');
  const nav = useAppNavigation();
  const { data: profile } = useCollectorProfile();
  const {
    data: guardians,
    isLoading: guardiansLoading,
    isError: guardiansError,
    refetch: refetchGuardians,
  } = useMyGuardians();
  const { data: identity } = useMyIdentity();
  const {
    data: logs,
    isLoading: logsLoading,
    isError: logsError,
    refetch: refetchLogs,
  } = useMyPickupLogs();
  const { data: pendingInvites } = usePendingInvites();
  const { data: schedules } = useCollectorPickupSchedules();

  const hasPending = (pendingInvites?.length ?? 0) > 0;
  const [onboardVisible, setOnboardVisible] = useState(false);
  const handleOnboardDismiss = useCallback(() => setOnboardVisible(false), []);
  const [selectedGuardian, setSelectedGuardian] =
    useState<CollectorGuardian | null>(null);

  const activeGuardians = useMemo(
    () => (guardians ?? []).filter(g => g.is_active),
    [guardians]
  );

  const stats = useMemo(() => {
    const allLogs = logs ?? [];
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisWeek = allLogs.filter(l => new Date(l.pickup_time) >= weekAgo);
    const incidents = allLogs.filter(
      l => l.status === 'denied' || l.status === 'cancelled'
    );
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
      labelKey: 'identity_badge_verified',
      color: '#10b981',
      bg: 'rgba(16,185,129,0.12)',
      iconName: 'shield-checkmark' as const,
    },
    pending: {
      labelKey: 'identity_badge_pending',
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.12)',
      iconName: 'time' as const,
    },
    refused: {
      labelKey: 'identity_badge_refused',
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.12)',
      iconName: 'shield-outline' as const,
    },
    expired: {
      labelKey: 'identity_badge_expired',
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.12)',
      iconName: 'shield-outline' as const,
    },
    none: {
      labelKey: 'identity_badge_none',
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.12)',
      iconName: 'warning' as const,
    },
  } as const;

  const badge =
    identityBadge[identityStatus as keyof typeof identityBadge] ??
    identityBadge.none;
  const recentLogs = (logs ?? []).slice(0, 5);

  if ((guardiansError && !guardians) || (logsError && !logs)) {
    return (
      <QueryError
        onRetry={() => {
          refetchGuardians();
          refetchLogs();
        }}
      />
    );
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
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
            }}
          >
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
                {t('home_eyebrow')}
              </Text>
              <Text
                style={{
                  color: theme.text,
                  fontSize: 26,
                  fontWeight: '800',
                  letterSpacing: -0.5,
                }}
              >
                {profile
                  ? t('home_greeting_name', { name: profile.first_name })
                  : t('home_greeting')}
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
              label={t('home_stat_total')}
              value={stats.total}
              icon="trend"
              tone="green"
              delay={50}
            />
            <StatCard
              label={t('home_stat_week')}
              value={stats.thisWeek}
              icon="calendar"
              tone="primary"
              delay={90}
            />
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <StatCard
              label={t('home_stat_active')}
              value={stats.activeAccess}
              icon="qr"
              tone="accent"
              delay={130}
            />
            <StatCard
              label={t('home_stat_incidents')}
              value={stats.incidents}
              icon="warning"
              tone={stats.incidents > 0 ? 'red' : 'neutral'}
              delay={170}
            />
          </View>
        </Animated.View>

        {/* Prochains pickups */}
        {schedules && schedules.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(190).duration(350)}
            style={{ marginBottom: 14 }}
          >
            <Text
              style={{
                color: theme.text,
                fontSize: 17,
                fontWeight: '700',
                marginBottom: 10,
              }}
            >
              {t('home_scheduled')}
            </Text>
            <View style={{ gap: 10 }}>
              {schedules.slice(0, 3).map(auth => {
                const todayOk = isTodayAuthorized(auth);
                const nextLabel = getNextPickupLabel(auth);
                const days = getActiveDayLabels(auth);
                const times = formatTimeWindows(auth);
                const guardian = guardians?.find(
                  g => g.id === auth.guardian_id
                );
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
                      borderColor: todayOk
                        ? 'rgba(16,185,129,0.3)'
                        : theme.cardBorder,
                      overflow: 'hidden',
                    }}
                  >
                    <View
                      style={{ flexDirection: 'row', alignItems: 'stretch' }}
                    >
                      <View
                        style={{
                          width: 4,
                          backgroundColor: todayOk
                            ? theme.green
                            : theme.cardBorder,
                        }}
                      />
                      <View style={{ flex: 1, padding: 14, gap: 8 }}>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <Text
                            style={{
                              color: theme.text,
                              fontWeight: '800',
                              fontSize: 15,
                            }}
                          >
                            {childName}
                          </Text>
                          {todayOk && (
                            <View
                              style={{
                                backgroundColor: theme.greenBg,
                                borderRadius: 8,
                                paddingHorizontal: 8,
                                paddingVertical: 3,
                              }}
                            >
                              <Text
                                style={{
                                  color: theme.green,
                                  fontSize: 11,
                                  fontWeight: '700',
                                }}
                              >
                                {t('home_today')}
                              </Text>
                            </View>
                          )}
                        </View>
                        {nextLabel && (
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            <Ionicons
                              name="time-outline"
                              size={12}
                              color={theme.accent}
                            />
                            <Text
                              style={{
                                color: theme.accent,
                                fontSize: 13,
                                fontWeight: '700',
                              }}
                            >
                              {nextLabel}
                            </Text>
                          </View>
                        )}
                        {schoolName && (
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            <Ionicons
                              name="location-outline"
                              size={11}
                              color={theme.textMuted}
                            />
                            <Text
                              style={{ color: theme.textMuted, fontSize: 12 }}
                            >
                              {schoolName}
                            </Text>
                          </View>
                        )}
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <Ionicons
                            name="calendar-outline"
                            size={11}
                            color={theme.textMuted}
                          />
                          <Text
                            style={{ color: theme.textSecondary, fontSize: 12 }}
                          >
                            {days.join(', ')}
                          </Text>
                          <Text
                            style={{ color: theme.textMuted, fontSize: 12 }}
                          >
                            ·
                          </Text>
                          <Text
                            style={{ color: theme.textSecondary, fontSize: 12 }}
                          >
                            {times}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* Pending invites */}
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
              <AppIcon name="userPlus" tone="accent" size={42} />
              <View style={{ flex: 1 }}>
                <Text
                  style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}
                >
                  {t('home_invites', { count: pendingInvites?.length ?? 1 })}
                </Text>
                <Text
                  style={{
                    color: theme.textSecondary,
                    fontSize: 12,
                    marginTop: 1,
                  }}
                >
                  {t('home_invites_hint')}
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Statut accès */}
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
            <AppIcon
              name={hasAnyAccess ? 'shield' : 'warning'}
              tone={hasAnyAccess ? 'green' : 'red'}
              size={52}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '800',
                  color: hasAnyAccess ? '#10b981' : '#ef4444',
                }}
              >
                {hasAnyAccess
                  ? t('home_access_active')
                  : t('home_access_suspended')}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: theme.textSecondary,
                  marginTop: 2,
                }}
              >
                {hasAnyAccess
                  ? t('home_children_authorized', {
                      count: activeGuardians.length,
                    })
                  : t('home_no_active_authorization')}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Statut identité */}
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
            <Ionicons name={badge.iconName} size={18} color={badge.color} />
            <Text
              style={{
                color: badge.color,
                fontSize: 13,
                fontWeight: '700',
                flex: 1,
              }}
            >
              {t(badge.labelKey)}
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
                {t('home_verify')}
              </Text>
            )}
          </View>
        </Animated.View>

        {/* Enfants autorisés */}
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
              {t('home_authorized_children')}
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
                      {t('home_authorized')}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        ) : null}

        {/* Récupérations récentes */}
        <Animated.View entering={FadeInDown.delay(340).duration(350)}>
          <Text
            style={{
              color: theme.text,
              fontSize: 17,
              fontWeight: '700',
              marginBottom: 12,
            }}
          >
            {t('home_recent')}
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
              <View style={{ padding: 24, alignItems: 'center', gap: 8 }}>
                <AppIcon name="clock" tone="neutral" size={48} />
                <Text
                  style={{
                    color: theme.textMuted,
                    fontSize: 14,
                    fontWeight: '500',
                  }}
                >
                  {t('home_no_pickup')}
                </Text>
              </View>
            ) : (
              recentLogs.map((log, i) => {
                const cfg = STATUS_CFG[log.status] ?? STATUS_CFG.cancelled;
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
                    <AppIcon name={cfg.icon} tone={cfg.tone} size={38} />
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
    </>
  );
}
