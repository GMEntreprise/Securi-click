import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import React, { memo, useCallback, useState } from 'react';
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLogin } from '../hooks/useLogin';
import { useRegisterParent } from '../hooks/useRegister';
import { useLastEmail } from '../hooks/useLastEmail';
import { AuthBackButton, AuthTabToggle } from '../components/ui';
import { ParentLoginForm } from './ParentLoginForm';
import { ParentRegisterFormV2 } from './ParentRegisterFormV2';
import { useTheme } from '@/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.34;

export const ParentAuthScreen: React.FC = memo(() => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const t = useTheme();
  const [activeTab, setActiveTab] = useState<0 | 1>(0);

  const lastEmail = useLastEmail();
  const loginMutation = useLogin();
  const registerMutation = useRegisterParent();

  const handleLogin = useCallback(
    (data: { email: string; password: string }) => {
      loginMutation.mutate(data);
    },
    [loginMutation]
  );

  const handleRegister = useCallback(
    (data: any) => {
      registerMutation.mutate(data);
    },
    [registerMutation]
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
      style={{ flex: 1, backgroundColor: t.bg }}
    >
      <AuthBackButton onPress={() => router.back()} />

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
          colors={[
            'transparent',
            t.isDark ? 'rgba(13,17,23,0.6)' : 'rgba(249,245,240,0.5)',
            t.bg,
          ]}
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
              key={lastEmail}
              onSubmit={handleLogin}
              isLoading={loginMutation.isPending}
              error={loginMutation.error?.message}
              onForgotPassword={handleForgotPassword}
              defaultEmail={lastEmail}
            />
          ) : (
            <ParentRegisterFormV2
              key={lastEmail}
              onSubmit={handleRegister}
              isLoading={registerMutation.isPending}
              error={registerMutation.error?.message}
              defaultEmail={lastEmail}
            />
          )}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
});

ParentAuthScreen.displayName = 'ParentAuthScreen';
