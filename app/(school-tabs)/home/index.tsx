import React, { memo, useCallback } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTabBarHeight } from '@/hooks/useTabBarHeight';
import { useAppNavigation } from '@/navigation/useAppNavigation';
import * as Haptics from 'expo-haptics';
import {
  CheckCircle2,
  ScanLine,
  XCircle,
  Users,
  Clock,
  ChevronRight,
} from 'lucide-react-native';
import { useTheme } from '@/theme';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { useMySchool } from '@/features/school/hooks/useSchool';
import {
  useDashboardStats,
  usePickupValidations,
} from '@/features/school/hooks/useValidations';
import { Avatar } from '@/shared/ui/base/avatar';
import type { PickupValidation } from '@/features/school/types';

export default function SchoolHomeScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useTabBarHeight();
  const theme = useTheme();
  const nav = useAppNavigation();

  const { data: school, isLoading: schoolLoading } = useMySchool();
  const schoolId = school?.id ?? '';
  const { data: stats, isLoading: statsLoading } = useDashboardStats(schoolId);

  const isLoading = schoolLoading || (!!schoolId && statsLoading && !stats);

  if (isLoading) {
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

  return (
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
        entering={FadeInDown.duration(350)}
        style={{ marginBottom: 28 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: theme.textMuted,
                fontSize: 13,
                fontWeight: '600',
                marginBottom: 2,
              }}
            >
              Bonjour,
            </Text>
            <Text
              style={{
                color: theme.text,
                fontSize: 24,
                fontWeight: '800',
                letterSpacing: -0.5,
              }}
            >
              {school?.name ?? 'Établissement'}
            </Text>
            <Text
              style={{ color: theme.textSecondary, fontSize: 14, marginTop: 4 }}
            >
              {stats
                ? `${stats.todayValidations} récupération${stats.todayValidations > 1 ? 's' : ''} aujourd'hui`
                : 'Chargement…'}
            </Text>
          </View>
          <NotificationBell />
        </View>
      </Animated.View>

      {/* Stats row */}
      <Animated.View
        entering={FadeInDown.delay(60).duration(350)}
        style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}
      >
        <StatCard
          icon={<CheckCircle2 size={20} color={theme.green} />}
          label="Validées"
          value={stats?.todayValidations ?? 0}
          bg={theme.greenBg}
          color={theme.green}
        />
        <StatCard
          icon={<XCircle size={20} color={theme.red} />}
          label="Refusées"
          value={stats?.todayRefusals ?? 0}
          bg={theme.redBg}
          color={theme.red}
        />
        <StatCard
          icon={<Users size={20} color={theme.primary} />}
          label="Élèves"
          value={stats?.enrolledCount ?? 0}
          bg={theme.primaryBg}
          color={theme.primary}
        />
      </Animated.View>

      {/* Scanner CTA */}
      <Animated.View
        entering={FadeInDown.delay(100).duration(350)}
        style={{ marginBottom: 24 }}
      >
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            nav.goToSchoolScanner();
          }}
          style={{
            backgroundColor: theme.accent,
            borderRadius: 20,
            paddingVertical: 18,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
          }}
        >
          <ScanLine size={22} color="#fff" strokeWidth={2.5} />
          <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800' }}>
            Scanner un QR Code
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Recent activity */}
      <Animated.View entering={FadeInDown.delay(140).duration(350)}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <Text style={{ color: theme.text, fontSize: 17, fontWeight: '700' }}>
            Activité récente
          </Text>
          <TouchableOpacity
            onPress={() => nav.goToSchoolHistory()}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
          >
            <Text
              style={{ color: theme.accent, fontSize: 13, fontWeight: '600' }}
            >
              Tout voir
            </Text>
            <ChevronRight size={14} color={theme.accent} />
          </TouchableOpacity>
        </View>

        {!stats?.recentValidations?.length ? (
          <View
            style={{
              backgroundColor: theme.card,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: theme.cardBorder,
              padding: 24,
              alignItems: 'center',
            }}
          >
            <Clock size={28} color={theme.textMuted} strokeWidth={1.5} />
            <Text
              style={{
                color: theme.textMuted,
                fontSize: 14,
                marginTop: 10,
                textAlign: 'center',
              }}
            >
              Aucune activité aujourd'hui
            </Text>
          </View>
        ) : (
          <View
            style={{
              backgroundColor: theme.card,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: theme.cardBorder,
              overflow: 'hidden',
            }}
          >
            {stats.recentValidations.map((v, idx) => (
              <ValidationRow
                key={v.id}
                item={v}
                isLast={idx === stats.recentValidations.length - 1}
              />
            ))}
          </View>
        )}
      </Animated.View>
    </ScrollView>
  );
}

const StatCard = memo(function StatCard({
  icon,
  label,
  value,
  bg,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  bg: string;
  color: string;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.card,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: theme.cardBorder,
        padding: 14,
        alignItems: 'center',
        gap: 6,
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
        }}
      >
        {icon}
      </View>
      <Text style={{ color: theme.text, fontSize: 22, fontWeight: '800' }}>
        {value}
      </Text>
      <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '600' }}>
        {label}
      </Text>
    </View>
  );
});

const ValidationRow = memo(function ValidationRow({
  item,
  isLast,
}: {
  item: PickupValidation;
  isLast: boolean;
}) {
  const theme = useTheme();
  const isOk = item.status === 'validated';
  const color = isOk ? theme.green : theme.red;
  const time = new Date(item.scanned_at).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: theme.separator,
      }}
    >
      <Avatar
        image={{
          uri: item.child?.photo_url ?? '',
          name: `${item.child?.first_name ?? ''} ${item.child?.last_name ?? ''}`.trim(),
        }}
        size={40}
        showBorder={false}
        backgroundColor={theme.primaryBg}
        textColor={theme.primary}
      />
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.text, fontSize: 14, fontWeight: '700' }}>
          {item.child?.first_name} {item.child?.last_name}
        </Text>
        <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 1 }}>
          {item.guardian
            ? `${item.guardian.first_name} ${item.guardian.last_name}`
            : 'Parent direct'}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 3 }}>
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 8,
            backgroundColor: isOk ? theme.greenBg : theme.redBg,
          }}
        >
          <Text style={{ color, fontSize: 11, fontWeight: '700' }}>
            {isOk ? 'Validé' : 'Refusé'}
          </Text>
        </View>
        <Text style={{ color: theme.textMuted, fontSize: 11 }}>{time}</Text>
      </View>
    </View>
  );
});
