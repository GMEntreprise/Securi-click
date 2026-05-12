import React, { memo } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, ScrollView } from 'react-native';
import { useRegisterParent } from '@/features/auth/hooks/useRegister';
import { ParentRegisterForm } from '@/features/auth/components/ParentRegisterForm';
import { useAuthStore } from '@/features/auth/store/auth.store';

export default function ParentRegisterScreen() {
  const registerMutation = useRegisterParent();
  const router = useRouter();
  const setLoading = useAuthStore(s => s.setLoading);

  const onSubmit = (data: any) => {
    registerMutation.mutate(data, {
      onSuccess: () => {
        router.replace('/(app)');
      },
    });
  };

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-6">
        <View className="items-center mb-6">
          <Text className="text-2xl font-bold text-foreground mb-2">
            Créer un compte Parent
          </Text>
          <Text className="text-muted-foreground text-center">
            Gérez vos enfants et leurs autorisations
          </Text>
        </View>

        <ParentRegisterForm
          onSubmit={onSubmit}
          isLoading={registerMutation.isPending}
          error={registerMutation.error?.message}
        />
      </View>
    </ScrollView>
  );
}
