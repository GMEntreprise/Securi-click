import React, { memo } from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';

interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = memo(
  ({
    children,
    onPress,
    isLoading = false,
    disabled = false,
    className = '',
  }) => {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled || isLoading}
        className={`bg-primary rounded-xl py-4 items-center ${disabled || isLoading ? 'opacity-60' : ''} ${className}`}
        style={{
          minHeight: 48,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text className="text-white font-semibold text-base text-center">
            {children}
          </Text>
        )}
      </Pressable>
    );
  }
);
