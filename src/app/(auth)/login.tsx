import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { useLogin } from '@/features/auth/hooks/useLogin';

export default function LoginScreen() {
  const loginMutation = useLogin();

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black" edges={['top']}>
      <View className="flex-1 justify-center px-6">
        <View className="items-center mb-10">
          <Text className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-2">
            SecuriClick
          </Text>
          <Text className="text-gray-600 dark:text-gray-400 text-center text-base">
            Connectez-vous pour continuer
          </Text>
        </View>

        <LoginForm
          onSubmit={data => {
            loginMutation.mutate(data, {
              onSuccess: () => {
                router.replace('/home');
              },
            });
          }}
          isLoading={loginMutation.isPending}
          errorMessage={
            loginMutation.error instanceof Error
              ? loginMutation.error.message
              : loginMutation.error
                ? String(loginMutation.error)
                : null
          }
        />
      </View>
    </SafeAreaView>
  );
}
