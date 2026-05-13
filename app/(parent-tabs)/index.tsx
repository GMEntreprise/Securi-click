import React, { useMemo, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '@/theme';
import { useSession } from '@/features/auth/store/auth.store';
import { router } from 'expo-router';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  Shield,
  Users,
  QrCode,
  Clock,
  CheckCircle,
  TrendingUp,
} from 'lucide-react-native';

const mockStats = {
  activeAuthorizations: 3,
  todayPickups: 2,
  childrenCount: 2,
};

const mockRecentActivity = [
  {
    id: '1',
    childName: 'Emma',
    time: '14:30',
    status: 'completed',
    collector: 'Jean Dupont',
  },
  {
    id: '2',
    childName: 'Lucas',
    time: '09:15',
    status: 'pending',
    collector: 'Marie Martin',
  },
  {
    id: '3',
    childName: 'Emma',
    time: '16:45',
    status: 'completed',
    collector: 'Jean Dupont',
  },
];

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
            padding: 16,
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
  item: (typeof mockRecentActivity)[0];
  index: number;
  isLast: boolean;
}) {
  const theme = useTheme();
  const isSuccess = item.status === 'completed';

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
          backgroundColor: isSuccess ? theme.greenBg : theme.amberBg,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        {isSuccess ? (
          <CheckCircle size={18} color={theme.green} strokeWidth={2} />
        ) : (
          <Clock size={18} color={theme.amber} strokeWidth={2} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.text, fontWeight: '600', fontSize: 14 }}>
          {item.childName}
        </Text>
        <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 1 }}>
          {item.collector} · {item.time}
        </Text>
      </View>
      <View
        style={{
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 20,
          backgroundColor: isSuccess ? theme.greenBg : theme.amberBg,
        }}
      >
        <Text
          style={{
            fontSize: 11,
            fontWeight: '700',
            color: isSuccess ? theme.green : theme.amber,
          }}
        >
          {isSuccess ? 'OK' : 'Attente'}
        </Text>
      </View>
    </Animated.View>
  );
});

export default function ParentDashboard() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const session = useSession();

  const firstName =
    session?.user.profile?.first_name ??
    session?.user.email?.split('@')[0] ??
    'Parent';

  const quickActions = useMemo<QuickAction[]>(
    () => [
      {
        id: 'qr',
        icon: <QrCode size={22} color={theme.accent} strokeWidth={2} />,
        label: 'QR Code',
        accentBg: theme.accentBg,
        onPress: () => router.push('/(parent-tabs)/qr' as any),
      },
      {
        id: 'children',
        icon: <Users size={22} color={theme.primary} strokeWidth={2} />,
        label: 'Enfants',
        accentBg: theme.primaryBg,
        onPress: () => router.push('/(parent-tabs)/children' as any),
      },
      {
        id: 'history',
        icon: <Clock size={22} color={theme.green} strokeWidth={2} />,
        label: 'Historique',
        accentBg: theme.greenBg,
        onPress: () => router.push('/(parent-tabs)/history' as any),
      },
    ],
    [theme]
  );

  const stats = useMemo(
    () => [
      {
        icon: <Shield size={18} color={theme.accent} />,
        label: 'Autorisations',
        value: mockStats.activeAuthorizations,
        bg: theme.accentBg,
        color: theme.accent,
      },
      {
        icon: <TrendingUp size={18} color={theme.green} />,
        label: 'Récupérations',
        value: mockStats.todayPickups,
        bg: theme.greenBg,
        color: theme.green,
      },
      {
        icon: <Users size={18} color={theme.primary} />,
        label: 'Enfants',
        value: mockStats.childrenCount,
        bg: theme.primaryBg,
        color: theme.primary,
      },
    ],
    [theme]
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingTop: insets.top + 20, paddingHorizontal: 20 }}>
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={{ marginBottom: 24 }}
        >
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
              <Text
                style={{ color: theme.text, fontSize: 22, fontWeight: '800' }}
              >
                {stat.value}
              </Text>
              <Text
                style={{
                  color: theme.textMuted,
                  fontSize: 11,
                  fontWeight: '600',
                  textAlign: 'center',
                  marginTop: 2,
                }}
              >
                {stat.label}
              </Text>
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
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {quickActions.map(a => (
              <QuickActionCard key={a.id} action={a} />
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
              onPress={() => router.push('/(parent-tabs)/history' as any)}
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
            {mockRecentActivity.map((item, i) => (
              <ActivityRow
                key={item.id}
                item={item}
                index={i}
                isLast={i === mockRecentActivity.length - 1}
              />
            ))}
          </View>
        </Animated.View>
      </View>
    </ScrollView>
  );
}
