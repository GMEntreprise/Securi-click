import React, { memo, useCallback } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

interface AuthPrimaryButtonProps {
  onPress: () => void;
  children: string;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'accent';
  icon?: React.ReactNode;
  className?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const AuthPrimaryButton: React.FC<AuthPrimaryButtonProps> = memo(
  ({
    onPress,
    children,
    isLoading = false,
    disabled = false,
    variant = 'accent',
    icon,
  }) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const handlePressIn = useCallback(() => {
      scale.value = withSpring(0.97, { damping: 20, stiffness: 400 });
    }, []);

    const handlePressOut = useCallback(() => {
      scale.value = withSpring(1, { damping: 20, stiffness: 400 });
    }, []);

    const bgColor = variant === 'accent' ? '#f97316' : '#1e3a8a';
    const isDisabled = disabled || isLoading;

    return (
      <AnimatedPressable
        style={[animatedStyle, { opacity: isDisabled ? 0.6 : 1 }]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
      >
        <View
          className="flex-row items-center justify-center rounded-full py-4 px-8"
          style={{ backgroundColor: bgColor, minHeight: 56 }}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text className="text-white font-bold text-base mr-2">
                {children}
              </Text>
              {icon}
            </>
          )}
        </View>
      </AnimatedPressable>
    );
  }
);

AuthPrimaryButton.displayName = 'AuthPrimaryButton';
