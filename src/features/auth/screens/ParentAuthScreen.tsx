import React, { memo, useState } from 'react';
import { View, Text, Image } from 'react-native';
import { PremiumAuthForm } from '../components/PremiumAuthForm';
import { useRouter } from 'expo-router';
import { useRegisterParent } from '../hooks/useRegister';

export const ParentAuthScreen: React.FC = memo(() => {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const registerMutation = useRegisterParent();

  const handleSubmit = (data: any) => {
    if (isLogin) {
      // Handle login - redirect to login screen
      router.push('/(auth)/login');
    } else {
      // Handle registration
      registerMutation.mutate(data, {
        onSuccess: () => {
          router.replace('/(app)/dashboard');
        },
      });
    }
  };

  const handleToggle = (newIsLogin: boolean) => {
    setIsLogin(newIsLogin);
    if (newIsLogin) {
      router.push('/(auth)/login');
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header Image */}
      <View className="items-center pt-12 pb-6">
        <View className="w-32 h-32 bg-blue-100 dark:bg-blue-900/20 rounded-3xl items-center justify-center mb-4">
          <Text className="text-5xl">👨‍👩‍👧‍👦</Text>
        </View>

        <Text className="text-2xl font-bold text-foreground mb-2 text-center">
          {isLogin ? 'Espace Parent' : 'Créer un compte Parent'}
        </Text>

        <Text className="text-muted-foreground text-center text-sm leading-relaxed">
          {isLogin
            ? 'Protégez vos enfants en toute sécurité'
            : 'Gérez vos enfants et leurs autorisations en quelques minutes'}
        </Text>
      </View>

      {/* Form */}
      <PremiumAuthForm
        role="parent"
        isLogin={isLogin}
        onSubmit={handleSubmit}
        isLoading={registerMutation.isPending}
        error={registerMutation.error?.message}
      />
    </View>
  );
});
