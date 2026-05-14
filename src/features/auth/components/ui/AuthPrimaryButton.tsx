import React, { memo, useCallback } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@/theme';

interface AuthPrimaryButtonProps {
  onPress: () => void;
  children: string;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'accent';
  icon?: React.ReactNode;
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
    const t = useTheme();
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const handlePressIn = useCallback(() => {
      scale.value = withSpring(0.97, { damping: 20, stiffness: 400 });
    }, [scale]);

    const handlePressOut = useCallback(() => {
      scale.value = withSpring(1, { damping: 20, stiffness: 400 });
    }, [scale]);

    const bgColor = variant === 'accent' ? t.accent : t.primary;
    const isDisabled = disabled || isLoading;

    return (
      <AnimatedPressable
        style={[animatedStyle, { opacity: isDisabled ? 0.45 : 1 }]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: bgColor,
            borderRadius: 18,
            paddingVertical: 16,
            paddingHorizontal: 32,
            minHeight: 56,
            gap: 8,
          }}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text
                style={{
                  color: '#fff',
                  fontWeight: '700',
                  fontSize: 16,
                }}
              >
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
