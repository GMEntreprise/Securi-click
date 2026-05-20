import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/theme';
import { useSession } from '@/features/auth/store/auth.store';
import { useAppNavigation } from '@/navigation/useAppNavigation';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTabBarHeight } from '@/hooks/useTabBarHeight';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useChildren } from '@/features/parent/hooks/useChildren';
import { useRecentPickupLogs } from '@/features/parent/hooks/usePickupLogs';
import type { PickupLog } from '@/features/parent/types';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { QueryError } from '@/shared/ui/base/query-error';
import { useChildrenSheetStore } from '@/features/parent/stores/childrenSheet.store';

interface QuickAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  accentBg: string;
  onPress: () => void;
}

const QuickActionCard = React.memo(function QuickActionCard({
  action,
}: {
  action: QuickAction;
}) {
  const scale = useSharedValue(1);
  const theme = useTheme();
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(() => {
    scale.value = withSpring(0.93, { damping: 12, stiffness: 300 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => {
      scale.value = withSpring(1);
      action.onPress();
    }, 100);
  }, [action, scale]);

  return (
    <TouchableOpacity onPress={handlePress} style={{ flex: 1 }}>
      <Animated.View
        style={[
          animStyle,
          {
            backgroundColor: theme.card,
            borderRadius: 20,
            padding: 18,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: theme.cardBorder,
          },
        ]}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 16,
            backgroundColor: action.accentBg,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 8,
          }}
        >
          {action.icon}
        </View>
        <Text
          style={{
            color: theme.text,
            fontSize: 12,
            fontWeight: '600',
            textAlign: 'center',
          }}
        >
          {action.label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
});

const ActivityRow = React.memo(function ActivityRow({
  item,
  index,
  isLast,
}: {
  item: PickupLog;
  index: number;
  isLast: boolean;
}) {
  const theme = useTheme();
  const isSuccess = item.status === 'completed';
  const isDenied = item.status === 'denied';

  const color = isSuccess ? theme.green : isDenied ? theme.red : theme.amber;
  const bg = isSuccess ? theme.greenBg : isDenied ? theme.redBg : theme.amberBg;
  const label = isSuccess ? 'OK' : isDenied ? 'Refus' : 'Annulé';

  const childName = item.child
    ? `${item.child.first_name} ${item.child.last_name}`
    : '—';
  const guardianName = item.guardian
    ? `${item.guardian.first_name} ${item.guardian.last_name}`
    : 'Inconnu';
  const time = new Date(item.pickup_time).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).duration(350)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: theme.separator,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        {isSuccess ? (
          <MaterialCommunityIcons name="check-circle-outline" size={20} color={color} />
        ) : isDenied ? (
          <MaterialCommunityIcons name="alert-circle-outline" size={20} color={color} />
        ) : (
          <MaterialCommunityIcons name="clock-outline" size={20} color={color} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.text, fontWeight: '600', fontSize: 14 }}>
          {childName}
        </Text>
        <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 1 }}>
          {guardianName} · {time}
        </Text>
      </View>
      <View
        style={{
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 20,
          backgroundColor: bg,
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: '700', color }}>{label}</Text>
      </View>
    </Animated.View>
  );
});

export default function ParentDashboard() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useTabBarHeight();
  const theme = useTheme();
  const session = useSession();
  const nav = useAppNavigation();

  const firstName =
    session?.user.profile?.first_name ??
    session?.user.email?.split('@')[0] ??
    'Parent';

  const { data: children, isError: childrenError, refetch: refetchChildren } = useChildren();
  const { data: recentLogs, isLoading: logsLoading, isError: logsError, refetch: refetchLogs } = useRecentPickupLogs(5);
  const requestChildrenSheetOpen = useChildrenSheetStore(s => s.requestOpen);

  if (childrenError || logsError) {
    return <QueryError onRetry={() => { refetchChildren(); refetchLogs(); }} />;
  }

  const childrenCount = children?.length ?? 0;
  const completedCount = (recentLogs ?? []).filter(
    l => l.status === 'completed'
  ).length;

  const quickActions = useMemo<QuickAction[]>(
    () => [
      {
        id: 'qr',
        icon: <MaterialCommunityIcons name="qrcode" size={24} color={theme.accent} />,
        label: 'QR Code',
        accentBg: theme.accentBg,
        onPress: () => nav.goToParentQr(),
      },
      {
        id: 'children',
        icon: <MaterialCommunityIcons name="account-group" size={24} color={theme.primary} />,
        label: childrenCount === 0 ? 'Ajouter un enfant' : 'Mes enfants',
        accentBg: theme.primaryBg,
        onPress: () => {
          if (childrenCount === 0) {
            nav.goToParentChildAdd();
          } else {
            requestChildrenSheetOpen();
            nav.goToParentChildren();
          }
        },
      },
      {
        id: 'add-guardian',
        icon: <MaterialCommunityIcons name="account-plus" size={24} color={theme.green} />,
        label: 'Autoriser',
        accentBg: theme.greenBg,
        onPress: () => nav.goToParentChildren(),
      },
      {
        id: 'history',
        icon: <MaterialCommunityIcons name="history" size={24} color={theme.textSecondary} />,
        label: 'Historique',
        accentBg: theme.iconBg,
        onPress: () => nav.goToParentHistory(),
      },
    ],
    [theme, nav, childrenCount, requestChildrenSheetOpen]
  );

  const stats = useMemo(
    () => [
      {
        icon: <MaterialCommunityIcons name="shield-half-full" size={20} color={theme.accent} />,
        label: childrenCount > 1 ? 'Enfants' : 'Enfant',
        value: childrenCount,
        bg: theme.accentBg,
        color: theme.accent,
      },
      {
        icon: <Feather name="trending-up" size={20} color={theme.green} />,
        label: completedCount > 1 ? 'Récupérations' : 'Récupération',
        value: completedCount,
        bg: theme.greenBg,
        color: theme.green,
      },
      {
        icon: <MaterialCommunityIcons name="file-document-outline" size={20} color={theme.primary} />,
        label: (recentLogs?.length ?? 0) > 1 ? 'Récents' : 'Récent',
        value: recentLogs?.length ?? 0,
        bg: theme.primaryBg,
        color: theme.primary,
      },
    ],
    [theme, childrenCount, completedCount, recentLogs]
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={{ paddingBottom: tabBarHeight + 20 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingTop: insets.top + 20, paddingHorizontal: 20 }}>
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
                  fontSize: 13,
                  fontWeight: '600',
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  marginBottom: 4,
                }}
              >
                Tableau de bord
              </Text>
              <Text
                style={{
                  color: theme.text,
                  fontSize: 28,
                  fontWeight: '800',
                  letterSpacing: -0.5,
                }}
              >
                Bonjour, {firstName}
              </Text>
              <Text
                style={{ color: theme.textSecondary, fontSize: 14, marginTop: 4 }}
              >
                Voici l'état de sécurité de vos enfants
              </Text>
            </View>
            <NotificationBell />
          </View>
        </Animated.View>

        {/* Stats row */}
        <Animated.View
          entering={FadeInDown.delay(80).duration(400)}
          style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}
        >
          {stats.map(stat => (
            <View
              key={stat.label}
              style={{
                flex: 1,
                backgroundColor: theme.card,
                borderRadius: 18,
                padding: 14,
                borderWidth: 1,
                borderColor: theme.cardBorder,
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: stat.bg,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                }}
              >
                {stat.icon}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
                <Text style={{ color: theme.text, fontSize: 22, fontWeight: '800' }}>
                  {stat.value}
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '600' }}>
                  {stat.label}
                </Text>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* Quick actions */}
        <Animated.View
          entering={FadeInDown.delay(160).duration(400)}
          style={{ marginBottom: 24 }}
        >
          <Text
            style={{
              color: theme.text,
              fontSize: 17,
              fontWeight: '700',
              marginBottom: 14,
            }}
          >
            Actions rapides
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {quickActions.map(a => (
              <View key={a.id} style={{ width: '47.5%' }}>
                <QuickActionCard action={a} />
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Recent activity */}
        <Animated.View entering={FadeInDown.delay(240).duration(400)}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
            }}
          >
            <Text
              style={{ color: theme.text, fontSize: 17, fontWeight: '700' }}
            >
              Activité récente
            </Text>
            <TouchableOpacity
              onPress={() => nav.goToParentHistory()}
            >
              <Text
                style={{ color: theme.accent, fontSize: 13, fontWeight: '600' }}
              >
                Voir tout
              </Text>
            </TouchableOpacity>
          </View>

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
              <ActivityIndicator
                color={theme.accent}
                style={{ paddingVertical: 24 }}
              />
            ) : (recentLogs ?? []).length === 0 ? (
              <View
                style={{ paddingVertical: 24, alignItems: 'center', gap: 8 }}
              >
                <MaterialCommunityIcons name="clock-outline" size={30} color={theme.textMuted} />
                <Text style={{ color: theme.textMuted, fontSize: 14 }}>
                  Aucune activité récente
                </Text>
              </View>
            ) : (
              (recentLogs ?? []).map((item, i) => (
                <ActivityRow
                  key={item.id}
                  item={item}
                  index={i}
                  isLast={i === (recentLogs ?? []).length - 1}
                />
              ))
            )}
          </View>
        </Animated.View>
      </View>
    </ScrollView>
  );
}
