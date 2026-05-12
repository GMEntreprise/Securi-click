import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { memo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { RoleCard } from '../components/RoleCard';

interface Role {
  id: 'parent' | 'school' | 'collector';
  title: string;
  description: string;
  icon: string;
  color: string;
  route: string;
}

const roles: Role[] = [
  {
    id: 'parent',
    title: 'Parent',
    description: 'Protégez vos enfants en toute sécurité',
    icon: '👨‍👩‍👧‍👦',
    color: 'bg-blue-500',
    route: '/(auth)/parent',
  },
  {
    id: 'school',
    title: 'Établissement',
    description: 'Sécurisez votre école',
    icon: '🏫',
    color: 'bg-green-500',
    route: '/(auth)/school',
  },
  {
    id: 'collector',
    title: 'Collecteur',
    description: 'Accès temporaire sécurisé',
    icon: '👤',
    color: 'bg-orange-500',
    route: '/(auth)/collector',
  },
];

export const RoleChoiceScreen: React.FC = memo(() => {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const titleAnim = useSharedValue(50);
  const subtitleAnim = useSharedValue(50);
  const cardsAnim = useSharedValue(0);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: withDelay(withTiming(1, { duration: 600 }), 200),
    transform: [{ translateY: withTiming(0, { duration: 500 }) }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: withDelay(withTiming(1, { duration: 600 }), 400),
    transform: [{ translateY: withTiming(0, { duration: 500 }) }],
  }));

  const cardsStyle = useAnimatedStyle(() => ({
    opacity: withDelay(withTiming(1, { duration: 600 }), 600),
    transform: [{ translateY: withTiming(0, { duration: 500 }) }],
  }));

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role.id);

    // Haptic feedback
    setTimeout(() => {
      router.push(role.route);
    }, 200);
  };

  return (
    <ScrollView
      className="flex-1 bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <View className="flex-1 px-6 pt-16 pb-8">
        {/* Header */}
        <Animated.View style={titleStyle} className="items-center mb-8">
          <View className="w-24 h-24 items-center justify-center mb-6">
            <Image
              source={require('@/assets/images/icon.png')}
              className="w-24 h-24 rounded-3xl"
              contentFit="contain"
            />
          </View>

          <Text className="text-3xl font-bold text-foreground mb-3 text-center">
            Bienvenue sur SecuriClick
          </Text>

          <Animated.View style={subtitleStyle}>
            <Text className="text-muted-foreground text-center text-base leading-relaxed">
              Choisissez votre type de compte pour commencer
            </Text>
          </Animated.View>
        </Animated.View>

        {/* Role Cards */}
        <Animated.View style={cardsStyle} className="flex-1">
          <View className="space-y-4">
            {roles.map((role, index) => (
              <RoleCard
                key={role.id}
                role={role.id}
                title={role.title}
                description={role.description}
                icon={role.icon}
                color={role.color}
                onPress={() => handleRoleSelect(role)}
                delay={index * 100}
              />
            ))}
          </View>
        </Animated.View>

        {/* Footer */}
        <View className="mt-8 items-center">
          <Text className="text-muted-foreground text-sm text-center">
            Vous avez déjà un compte ?{' '}
            <Text
              className="text-primary font-semibold"
              onPress={() => router.push('/(auth)/login')}
            >
              Se connecter
            </Text>
          </Text>
        </View>
      </View>
    </ScrollView>
  );
});
