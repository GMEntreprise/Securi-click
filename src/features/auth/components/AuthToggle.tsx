import React, { memo, useState } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface Props {
  isLogin: boolean;
  onToggle: (isLogin: boolean) => void;
}

export const AuthToggle: React.FC<Props> = memo(({ isLogin, onToggle }) => {
  const widthAnim = useSharedValue(isLogin ? 100 : 160);
  const translateAnim = useSharedValue(isLogin ? 0 : 30);

  const animatedStyle = useAnimatedStyle(() => ({
    width: withTiming(widthAnim.value, { duration: 200 }),
    transform: [
      { translateX: withTiming(translateAnim.value, { duration: 200 }) },
    ],
  }));

  const handleToggle = () => {
    const newLogin = !isLogin;
    onToggle(newLogin);

    widthAnim.value = withSpring(newLogin ? 100 : 160, {
      damping: 20,
      stiffness: 300,
    });

    translateAnim.value = withSpring(newLogin ? 0 : 30, {
      damping: 20,
      stiffness: 300,
    });
  };

  return (
    <View className="items-center mt-6">
      <TouchableOpacity
        onPress={handleToggle}
        activeOpacity={0.8}
        className="relative overflow-hidden"
      >
        <Animated.View
          style={animatedStyle}
          className="bg-primary rounded-full py-4 px-6 items-center justify-center"
        >
          <Text className="text-white font-semibold text-base">
            {isLogin ? 'Se connecter' : 'Créer un compte'}
          </Text>
        </Animated.View>
      </TouchableOpacity>

      <View className="mt-3 items-center">
        <Text className="text-muted-foreground text-sm">
          {isLogin ? 'Pas encore de compte ?' : 'Déjà un compte ?'}
        </Text>
      </View>
    </View>
  );
});
