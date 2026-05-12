import React, { memo, useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { PremiumAuthForm } from '../components/PremiumAuthForm';
import { useRouter } from 'expo-router';
import { useLogin } from '../hooks/useLogin';

export const CollectorAuthScreen: React.FC = memo(() => {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [invitationCode, setInvitationCode] = useState('');
  const loginMutation = useLogin();

  const handleSubmit = (data: any) => {
    const formData = {
      ...data,
      ...(isLogin ? {} : { invitation_token: invitationCode }),
    };

    if (isLogin) {
      loginMutation.mutate(formData, {
        onSuccess: () => {
          router.replace('/(app)/dashboard');
        },
      });
    } else {
      // Handle collector registration with invitation
      // TODO: Implement collector registration hook
      console.log('Collector registration:', formData);
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
      {/* Header */}
      <View className="items-center pt-12 pb-6">
        <View className="w-32 h-32 bg-orange-100 dark:bg-orange-900/20 rounded-3xl items-center justify-center mb-4">
          <Text className="text-5xl">👤</Text>
        </View>

        <Text className="text-2xl font-bold text-foreground mb-2 text-center">
          {isLogin ? 'Espace Collecteur' : 'Inscription Collecteur'}
        </Text>

        <Text className="text-muted-foreground text-center text-sm leading-relaxed">
          {isLogin
            ? 'Accès sécurisé temporaire'
            : "Rejoignez avec votre code d'invitation"}
        </Text>
      </View>

      {/* Invitation Code (Registration Only) */}
      {!isLogin && (
        <View className="px-6 mb-6">
          <Text className="text-foreground font-medium mb-2">
            Code d'invitation
          </Text>
          <View className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-4">
            <TextInput
              className="text-foreground text-base"
              placeholder="Entrez votre code d'invitation"
              value={invitationCode}
              onChangeText={setInvitationCode}
              placeholderTextColor="#9CA3AF"
              selectionColor="#1E3A8A"
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </View>
        </View>
      )}

      {/* Form */}
      <PremiumAuthForm
        role="collector"
        isLogin={isLogin}
        onSubmit={handleSubmit}
        isLoading={loginMutation.isPending}
        error={loginMutation.error?.message}
      />
    </View>
  );
});
