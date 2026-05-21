import { useAppNavigation } from '@/navigation/useAppNavigation';
import { useTheme } from '@/theme';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { memo, useCallback, useMemo, useState } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
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
  icon: (color: string) => React.ReactNode;
  route: string;
}

const ROLES: RoleItem[] = [
  {
    id: 'parent',
    title: 'Parent',
    description: 'Suivi et sécurité des enfants',
    icon: color => <FontAwesome6 name="user-group" size={22} color={color} />,
    route: '/(auth)/parent',
  },
  {
    id: 'collector',
    title: 'Collecteur',
    description: 'Validation des autorisations',
    icon: color => (
      <MaterialCommunityIcons name="shield-check" size={24} color={color} />
    ),
    route: '/(auth)/collector-pin',
  },
  {
    id: 'school',
    title: 'Établissement',
    description: 'Gestion globale de la sécurité',
    icon: color => (
      <MaterialCommunityIcons name="school" size={24} color={color} />
    ),
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
    const t = useTheme();
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

    const cardBorder = selected ? t.primary : t.cardBorder;
    const iconBg = selected ? t.primaryBg : t.iconBg;

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
              backgroundColor: t.card,
              borderWidth: 2,
              borderColor: cardBorder,
              shadowColor: selected ? t.primary : '#000',
              shadowOffset: { width: 0, height: selected ? 4 : 1 },
              shadowOpacity: selected
                ? t.isDark
                  ? 0.3
                  : 0.12
                : t.isDark
                  ? 0
                  : 0.04,
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
              {item.icon(t.primary)}
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: t.text,
                  marginBottom: 2,
                }}
              >
                {item.title}
              </Text>
              <Text style={{ fontSize: 13, color: t.textSecondary }}>
                {item.description}
              </Text>
            </View>
            {selected && (
              <Animated.View entering={FadeInUp.duration(200)}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={22}
                  color={t.primary}
                />
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
  const nav = useAppNavigation();
  const insets = useSafeAreaInsets();
  const t = useTheme();
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
    nav.pushRoute(selectedRoute);
  }, [selectedRoute, nav]);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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
              t.isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)',
              t.isDark ? 'rgba(13,17,23,0.6)' : 'rgba(249,245,240,0.5)',
              t.bg,
            ]}
            locations={[0, 0.65, 1]}
            style={{ position: 'absolute', inset: 0 }}
          />
        </View>

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
                color: t.text,
                marginBottom: 6,
              }}
            >
              Choisissez votre rôle
            </Text>
            <Text style={{ fontSize: 15, color: t.textSecondary }}>
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
          backgroundColor: t.ctaBg,
          borderTopWidth: 1,
          borderTopColor: t.ctaBorder,
        }}
      >
        <AuthPrimaryButton
          onPress={handleContinue}
          disabled={!selectedId}
          variant="primary"
        >
          Continuer
        </AuthPrimaryButton>
        <View style={{ alignItems: 'center', marginTop: 14, gap: 2 }}>
          <Text
            style={{
              color: t.primary,
              fontSize: 13,
              fontWeight: '700',
              letterSpacing: 0.3,
            }}
          >
            &#174;Securi'Click
          </Text>
          <Text
            style={{
              color: t.textMuted,
              fontSize: 11,
              letterSpacing: 0.2,
            }}
          >
            Tous droits réservés
          </Text>
        </View>
      </Animated.View>
    </View>
  );
});

RoleChoiceScreen.displayName = 'RoleChoiceScreen';
