import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  CheckCircle2,
  GraduationCap,
  Shield,
  Users,
} from 'lucide-react-native';
import React, { memo, useCallback, useMemo, useState } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthPrimaryButton } from '../components/ui';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.36;

interface RoleItem {
  id: 'parent' | 'school' | 'collector';
  title: string;
  description: string;
  Icon: React.ComponentType<{
    size: number;
    color: string;
    strokeWidth: number;
  }>;
  route: string;
}

const ROLES: RoleItem[] = [
  {
    id: 'parent',
    title: 'Parent',
    description: 'Suivi et sécurité des enfants',
    Icon: Users,
    route: '/(auth)/parent',
  },
  {
    id: 'collector',
    title: 'Collecteur',
    description: 'Validation des autorisations',
    Icon: Shield,
    route: '/(auth)/collector',
  },
  {
    id: 'school',
    title: 'Établissement',
    description: 'Gestion globale de la sécurité',
    Icon: GraduationCap,
    route: '/(auth)/school',
  },
];

interface RoleCardProps {
  item: RoleItem;
  selected: boolean;
  onPress: (item: RoleItem) => void;
  index: number;
}

const RoleCard: React.FC<RoleCardProps> = memo(
  ({ item, selected, onPress, index }) => {
    const dark = useColorScheme() === 'dark';
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const handlePressIn = useCallback(() => {
      scale.value = withSpring(0.98, { damping: 20, stiffness: 400 });
    }, [scale]);

    const handlePressOut = useCallback(() => {
      scale.value = withSpring(1, { damping: 20, stiffness: 400 });
    }, [scale]);

    const { Icon } = item;

    const cardBg = dark ? '#161b22' : '#ffffff';
    const cardBorder = selected ? '#1e3a8a' : dark ? '#21262d' : '#f0ede8';
    const iconBg = selected
      ? dark
        ? 'rgba(59,130,246,0.2)'
        : 'rgba(30,58,138,0.1)'
      : dark
        ? '#1c2128'
        : '#f3f4f6';
    const titleColor = dark ? '#f9fafb' : '#111827';
    const descColor = dark ? '#9ca3af' : '#6b7280';

    return (
      <Animated.View
        entering={FadeInDown.delay(150 + index * 80).duration(400)}
        style={[animatedStyle, { marginBottom: 12 }]}
      >
        <Pressable
          onPress={() => onPress(item)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 16,
              borderRadius: 24,
              backgroundColor: cardBg,
              borderWidth: 2,
              borderColor: cardBorder,
              shadowColor: selected ? '#1e3a8a' : '#000',
              shadowOffset: { width: 0, height: selected ? 4 : 1 },
              shadowOpacity: selected ? (dark ? 0.3 : 0.12) : dark ? 0 : 0.04,
              shadowRadius: selected ? 12 : 3,
              elevation: selected ? 6 : 1,
            }}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 18,
                backgroundColor: iconBg,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 14,
              }}
            >
              <Icon size={24} color="#1e3a8a" strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: titleColor,
                  marginBottom: 2,
                }}
              >
                {item.title}
              </Text>
              <Text style={{ fontSize: 13, color: descColor }}>
                {item.description}
              </Text>
            </View>
            {selected && (
              <Animated.View entering={FadeInUp.duration(200)}>
                <CheckCircle2 size={22} color="#1e3a8a" strokeWidth={2} />
              </Animated.View>
            )}
          </View>
        </Pressable>
      </Animated.View>
    );
  }
);

RoleCard.displayName = 'RoleCard';

export const RoleChoiceScreen: React.FC = memo(() => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dark = useColorScheme() === 'dark';
  const [selectedId, setSelectedId] = useState<RoleItem['id'] | null>(null);

  const selectedRoute = useMemo(
    () => ROLES.find(r => r.id === selectedId)?.route,
    [selectedId]
  );

  const handleRolePress = useCallback((item: RoleItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedId(item.id);
  }, []);

  const handleContinue = useCallback(() => {
    if (!selectedRoute) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(selectedRoute as any);
  }, [selectedRoute, router]);

  const bgColor = dark ? '#0d1117' : '#f9f5f0';
  const gradientEnd = dark ? '#0d1117' : '#f9f5f0';
  const ctaBg = dark ? 'rgba(13,17,23,0.97)' : 'rgba(249,245,240,0.97)';
  const ctaBorder = dark ? '#21262d' : 'rgba(0,0,0,0.06)';

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      <View style={{ height: HERO_HEIGHT }}>
        <Image
          source={require('../../../../assets/images/icon.png')}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
          }}
          resizeMode="cover"
        />
        <LinearGradient
          colors={[
            dark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)',
            dark ? 'rgba(13,17,23,0.6)' : 'rgba(249,245,240,0.5)',
            gradientEnd,
          ]}
          locations={[0, 0.65, 1]}
          style={{ position: 'absolute', inset: 0 }}
        />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
          <Animated.View
            entering={FadeInDown.delay(80).duration(500)}
            style={{ marginBottom: 28 }}
          >
            <Text
              style={{
                fontSize: 28,
                fontWeight: '800',
                letterSpacing: -0.5,
                color: dark ? '#f9fafb' : '#111827',
                marginBottom: 6,
              }}
            >
              Choisissez votre rôle
            </Text>
            <Text style={{ fontSize: 15, color: dark ? '#9ca3af' : '#6b7280' }}>
              Pour une expérience personnalisée
            </Text>
          </Animated.View>

          {ROLES.map((role, index) => (
            <RoleCard
              key={role.id}
              item={role}
              selected={selectedId === role.id}
              onPress={handleRolePress}
              index={index}
            />
          ))}
        </View>
      </ScrollView>

      <Animated.View
        entering={FadeInUp.delay(400).duration(500)}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingBottom: insets.bottom + 16,
          paddingHorizontal: 24,
          paddingTop: 16,
          backgroundColor: ctaBg,
          borderTopWidth: 1,
          borderTopColor: ctaBorder,
        }}
      >
        <AuthPrimaryButton
          onPress={handleContinue}
          disabled={!selectedId}
          variant="primary"
        >
          Continuer
        </AuthPrimaryButton>
        <Text
          style={{
            textAlign: 'center',
            color: dark ? '#4b5563' : '#9ca3af',
            fontSize: 10,
            letterSpacing: 2,
            marginTop: 10,
          }}
        >
          SECURI'CLICK • PLATEFORME SÉCURISÉE
        </Text>
      </Animated.View>
    </View>
  );
});

RoleChoiceScreen.displayName = 'RoleChoiceScreen';
