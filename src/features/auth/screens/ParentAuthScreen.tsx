import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { memo, useCallback, useState } from 'react';
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useColorScheme,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLogin } from '../hooks/useLogin';
import { useRegisterParent } from '../hooks/useRegister';
import { AuthBackButton, AuthTabToggle } from '../components/ui';
import { ParentLoginForm } from './ParentLoginForm';
import { ParentRegisterFormV2 } from './ParentRegisterFormV2';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.34;

export const ParentAuthScreen: React.FC = memo(() => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dark = useColorScheme() === 'dark';
  const [activeTab, setActiveTab] = useState<0 | 1>(0);

  const loginMutation = useLogin();
  const registerMutation = useRegisterParent();

  const handleLogin = useCallback(
    (data: { email: string; password: string }) => {
      loginMutation.mutate(data, {
        onSuccess: () => router.replace('/(parent-tabs)' as any),
      });
    },
    [loginMutation, router]
  );

  const handleRegister = useCallback(
    (data: any) => {
      registerMutation.mutate(data, {
        onSuccess: () => router.replace('/(parent-tabs)' as any),
      });
    },
    [registerMutation, router]
  );

  const handleForgotPassword = useCallback(() => {
    router.push('/(auth)/login');
  }, [router]);

  const handleTabToggle = useCallback((index: 0 | 1) => {
    setActiveTab(index);
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: dark ? '#0d1117' : '#f9f5f0' }}
    >
      <AuthBackButton onPress={() => router.back()} light />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        <Image
          source={require('../../../../assets/images/icon.png')}
          style={{ width: '100%', height: HERO_HEIGHT }}
          resizeMode="cover"
        />
        <LinearGradient
          colors={
            dark
              ? ['transparent', 'rgba(13,17,23,0.6)', '#0d1117']
              : ['transparent', 'rgba(249,245,240,0.5)', '#f9f5f0']
          }
          locations={[0.4, 0.75, 1]}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: HERO_HEIGHT,
          }}
          pointerEvents="none"
        />

        <Animated.View entering={FadeInDown.duration(400)}>
          <AuthTabToggle
            leftLabel="Se connecter"
            rightLabel="Créer un compte"
            activeIndex={activeTab}
            onToggle={handleTabToggle}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(400)}>
          {activeTab === 0 ? (
            <ParentLoginForm
              onSubmit={handleLogin}
              isLoading={loginMutation.isPending}
              error={loginMutation.error?.message}
              onForgotPassword={handleForgotPassword}
            />
          ) : (
            <ParentRegisterFormV2
              onSubmit={handleRegister}
              isLoading={registerMutation.isPending}
              error={registerMutation.error?.message}
            />
          )}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
});

ParentAuthScreen.displayName = 'ParentAuthScreen';
