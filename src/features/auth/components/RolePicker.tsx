import React, { memo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

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
    description: 'Gérer mes enfants et autorisations',
    icon: '👨‍👩‍👧‍👦',
    color: 'bg-blue-500',
    route: '/(auth)/register/parent',
  },
  {
    id: 'school',
    title: 'Établissement',
    description: 'Administrer mon école',
    icon: '🏫',
    color: 'bg-green-500',
    route: '/(auth)/register/school',
  },
  {
    id: 'collector',
    title: 'Collecteur',
    description: 'Récupérer les enfants autorisés',
    icon: '👤',
    color: 'bg-orange-500',
    route: '/(auth)/register/collector',
  },
];

interface Props {
  onSelectRole?: (role: Role) => void;
}

export const RolePicker: React.FC<Props> = memo(({ onSelectRole }) => {
  const router = useRouter();

  const handleRoleSelect = (role: Role) => {
    onSelectRole?.(role);
    router.push(role.route);
  };

  return (
    <View className="flex-1 bg-background p-6">
      <View className="items-center mb-8">
        <Text className="text-3xl font-bold text-foreground mb-2">
          Bienvenue sur SecuriClick
        </Text>
        <Text className="text-muted-foreground text-center">
          Choisissez votre type de compte
        </Text>
      </View>

      <View className="space-y-4">
        {roles.map(role => (
          <Pressable
            key={role.id}
            onPress={() => handleRoleSelect(role)}
            className={`${role.color} rounded-2xl p-6 active:opacity-80`}
          >
            <View className="flex-row items-center space-x-4">
              <Text className="text-4xl">{role.icon}</Text>
              <View className="flex-1">
                <Text className="text-white font-semibold text-lg mb-1">
                  {role.title}
                </Text>
                <Text className="text-white/80 text-sm">
                  {role.description}
                </Text>
              </View>
            </View>
          </Pressable>
        ))}
      </View>

      <View className="mt-8 items-center">
        <Text className="text-muted-foreground text-sm">
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
  );
});
