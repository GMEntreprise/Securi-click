import React, { useMemo, useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  Shield,
  Phone,
  Calendar,
  ToggleLeft,
  ToggleRight,
  UserPlus,
  GraduationCap,
  MapPin,
} from 'lucide-react-native';

const mockChildren: Record<
  string,
  {
    id: string;
    firstName: string;
    lastName: string;
    age: number;
    school: string;
    grade: string;
  }
> = {
  '1': {
    id: '1',
    firstName: 'Emma',
    lastName: 'Dupont',
    age: 8,
    school: 'École Primaire Saint-Exupéry',
    grade: 'CE2',
  },
  '2': {
    id: '2',
    firstName: 'Lucas',
    lastName: 'Dupont',
    age: 6,
    school: 'École Maternelle Les Petits Loups',
    grade: 'CP',
  },
};

const mockAuthorizations = [
  {
    id: '1',
    firstName: 'Jean',
    lastName: 'Dupont',
    phone: '06 11 22 33 44',
    relation: 'Grand-père',
    validUntil: '2025-12-31',
    isActive: true,
  },
  {
    id: '2',
    firstName: 'Marie',
    lastName: 'Martin',
    phone: '06 55 66 77 88',
    relation: 'Tante',
    validUntil: '2025-11-30',
    isActive: false,
  },
];

type Authorization = (typeof mockAuthorizations)[0];

const AuthorizationCard = React.memo(function AuthorizationCard({
  item,
  index,
  onToggle,
}: {
  item: Authorization;
  index: number;
  onToggle: (id: string) => void;
}) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: withSpring(scale.value, { damping: 15, stiffness: 300 }) },
    ],
  }));

  const daysLeft = useMemo(() => {
    const diff = new Date(item.validUntil).getTime() - Date.now();
    return Math.ceil(diff / 86400000);
  }, [item.validUntil]);

  const expiryColor =
    daysLeft <= 7 ? theme.red : daysLeft <= 30 ? theme.amber : theme.green;
  const expiryBg =
    daysLeft <= 7
      ? theme.redBg
      : daysLeft <= 30
        ? theme.amberBg
        : theme.greenBg;

  const handleToggle = useCallback(() => {
    scale.value = 0.95;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => {
      scale.value = 1;
      onToggle(item.id);
    }, 100);
  }, [item.id, onToggle, scale]);

  const initials = `${item.firstName[0]}${item.lastName[0]}`;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).duration(400)}
      style={{ marginBottom: 10 }}
    >
      <View
        style={{
          backgroundColor: theme.card,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: item.isActive
            ? 'rgba(16,185,129,0.25)'
            : theme.cardBorder,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: 4,
            position: 'absolute',
            top: 0,
            bottom: 0,
            backgroundColor: item.isActive ? theme.green : theme.separator,
          }}
        />
        <View style={{ padding: 14, paddingLeft: 18 }}>
          {/* Top row */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: item.isActive ? theme.greenBg : theme.iconBg,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <Text
                style={{
                  color: item.isActive ? theme.green : theme.textMuted,
                  fontSize: 15,
                  fontWeight: '800',
                }}
              >
                {initials}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: theme.text,
                  fontWeight: '700',
                  fontSize: 15,
                }}
              >
                {item.firstName} {item.lastName}
              </Text>
              <Text
                style={{ color: theme.textMuted, fontSize: 12, marginTop: 1 }}
              >
                {item.relation}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleToggle}
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: item.isActive ? theme.greenBg : theme.iconBg,
              }}
            >
              <Animated.View style={animatedStyle}>
                {item.isActive ? (
                  <ToggleRight size={22} color={theme.green} />
                ) : (
                  <ToggleLeft size={22} color={theme.textMuted} />
                )}
              </Animated.View>
            </TouchableOpacity>
          </View>

          {/* Details */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Phone size={12} color={theme.textMuted} />
              <Text style={{ color: theme.textMuted, fontSize: 12 }}>
                {item.phone}
              </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Calendar size={12} color={theme.textMuted} />
              <View
                style={{
                  backgroundColor: expiryBg,
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                  borderRadius: 8,
                }}
              >
                <Text
                  style={{
                    color: expiryColor,
                    fontSize: 11,
                    fontWeight: '700',
                  }}
                >
                  {daysLeft <= 0
                    ? 'Expirée'
                    : daysLeft === 1
                      ? '1 jour'
                      : `${daysLeft} jours`}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
});

export default function ChildDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [authorizations, setAuthorizations] = useState(mockAuthorizations);

  const child = mockChildren[id ?? '1'] ?? mockChildren['1'];

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  const handleToggle = useCallback((authId: string) => {
    setAuthorizations(prev =>
      prev.map(a => (a.id === authId ? { ...a, isActive: !a.isActive } : a))
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const handleAddPerson = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(parent-tabs)/children/add' as any);
  }, [router]);

  const activeCount = useMemo(
    () => authorizations.filter(a => a.isActive).length,
    [authorizations]
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={{
            backgroundColor: theme.card,
            borderBottomWidth: 1,
            borderBottomColor: theme.cardBorder,
            paddingTop: insets.top + 16,
            paddingBottom: 20,
            paddingHorizontal: 20,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <TouchableOpacity
              onPress={handleBack}
              style={{
                width: 40,
                height: 40,
                borderRadius: 14,
                backgroundColor: theme.iconBg,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 14,
              }}
            >
              <ArrowLeft size={20} color={theme.text} strokeWidth={2} />
            </TouchableOpacity>
            <View>
              <Text
                style={{
                  color: theme.textMuted,
                  fontSize: 11,
                  fontWeight: '700',
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  marginBottom: 2,
                }}
              >
                Fiche enfant
              </Text>
              <Text
                style={{
                  color: theme.text,
                  fontSize: 22,
                  fontWeight: '800',
                  letterSpacing: -0.5,
                }}
              >
                {child.firstName} {child.lastName}
              </Text>
            </View>
          </View>

          {/* Child info pills */}
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                backgroundColor: theme.primaryBg,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 10,
              }}
            >
              <GraduationCap size={13} color={theme.primary} />
              <Text
                style={{
                  color: theme.primary,
                  fontSize: 12,
                  fontWeight: '700',
                }}
              >
                {child.grade}
              </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                backgroundColor: theme.iconBg,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 10,
              }}
            >
              <MapPin size={13} color={theme.textMuted} />
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: 12,
                  fontWeight: '600',
                }}
                numberOfLines={1}
              >
                {child.school}
              </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                backgroundColor: theme.greenBg,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 10,
              }}
            >
              <Shield size={13} color={theme.green} />
              <Text
                style={{
                  color: theme.green,
                  fontSize: 12,
                  fontWeight: '700',
                }}
              >
                {activeCount} autorisation{activeCount > 1 ? 's' : ''} active
                {activeCount > 1 ? 's' : ''}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Authorizations list */}
        <View style={{ padding: 16 }}>
          <Animated.View
            entering={FadeInDown.delay(100).duration(400)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
            }}
          >
            <Text
              style={{
                color: theme.text,
                fontSize: 17,
                fontWeight: '700',
              }}
            >
              Personnes autorisées
            </Text>
            <TouchableOpacity
              onPress={handleAddPerson}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                backgroundColor: theme.accent,
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 12,
              }}
            >
              <UserPlus size={14} color="#fff" strokeWidth={2.5} />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>
                Ajouter
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {authorizations.map((auth, i) => (
            <AuthorizationCard
              key={auth.id}
              item={auth}
              index={i}
              onToggle={handleToggle}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
