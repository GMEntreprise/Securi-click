import React, { memo, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { PremiumAuthForm } from '../components/PremiumAuthForm';
import { useRouter } from 'expo-router';
import { useLogin } from '../hooks/useLogin';

export const SchoolAuthScreen: React.FC = memo(() => {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const loginMutation = useLogin();

  const handleSubmit = (data: any) => {
    if (isLogin) {
      loginMutation.mutate(data, {
        onSuccess: () => {
          router.replace('/(app)/dashboard');
        },
      });
    } else {
      // Handle school registration
      // TODO: Implement school registration hook
      console.log('School registration:', data);
    }
  };

  const handleToggle = (newIsLogin: boolean) => {
    setIsLogin(newIsLogin);
    if (newIsLogin) {
      router.push('/(auth)/login');
    }
  };

  const nextStep = () => {
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="items-center pt-12 pb-6">
        <View className="w-32 h-32 bg-green-100 dark:bg-green-900/20 rounded-3xl items-center justify-center mb-4">
          <Text className="text-5xl">🏫</Text>
        </View>

        <Text className="text-2xl font-bold text-foreground mb-2 text-center">
          {isLogin ? 'Espace Établissement' : 'Créer un compte Établissement'}
        </Text>

        <Text className="text-muted-foreground text-center text-sm leading-relaxed">
          {isLogin
            ? 'Administrez votre établissement'
            : 'Sécurisez votre école en 2 étapes'}
        </Text>
      </View>

      {/* Stepper (Registration Only) */}
      {!isLogin && (
        <View className="px-6 mb-6">
          <View className="flex-row justify-center mb-4">
            {[1, 2].map(step => (
              <View
                key={step}
                className={`w-8 h-8 rounded-full mx-1 items-center justify-center ${
                  step <= currentStep
                    ? 'bg-primary'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    step <= currentStep ? 'text-white' : 'text-gray-500'
                  }`}
                >
                  {step}
                </Text>
              </View>
            ))}
          </View>

          <Text className="text-center text-muted-foreground text-sm">
            {currentStep === 1
              ? "Informations de l'établissement"
              : 'Responsable'}
          </Text>
        </View>
      )}

      {/* Form */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <PremiumAuthForm
          role="school"
          isLogin={isLogin}
          onSubmit={handleSubmit}
          isLoading={loginMutation.isPending}
          error={loginMutation.error?.message}
        />
      </ScrollView>
    </View>
  );
});
