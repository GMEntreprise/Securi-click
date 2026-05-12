import { ForgotPasswordButton } from '@/components/ui/ForgotPasswordButton';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { useLogin } from '@/features/auth/hooks/useLogin';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';

export default function LoginScreen() {
  const loginMutation = useLogin();
  const router = useRouter();
  const setLoading = useAuthStore(s => s.setLoading);

  const onSubmit = (data: any) => {
    loginMutation.mutate(data, {
      onSuccess: () => {
        router.replace('/(app)');
      },
    });
  };

  return (
    <View className="flex-1 bg-background p-6">
      <View className="items-center mb-8">
        <Text className="text-3xl font-bold text-foreground mb-2">
          Bienvenue sur SecuriClick
        </Text>
        <Text className="text-muted-foreground text-center">
          Connectez-vous pour continuer
        </Text>
      </View>

      <LoginForm
        onSubmit={onSubmit}
        isLoading={loginMutation.isPending}
        error={loginMutation.error?.message}
      />

      <ForgotPasswordButton />
    </View>
  );
}
