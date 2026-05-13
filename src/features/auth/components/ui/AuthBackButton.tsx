import { ChevronLeft } from 'lucide-react-native';
import React, { memo } from 'react';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AuthBackButtonProps {
  onPress: () => void;
  light?: boolean;
}

export const AuthBackButton: React.FC<AuthBackButtonProps> = memo(
  ({ onPress, light = true }) => {
    const insets = useSafeAreaInsets();

    return (
      <Pressable
        onPress={onPress}
        hitSlop={12}
        style={{
          top: insets.top + 12,
          left: 16,
          position: 'absolute',
          zIndex: 10,
        }}
        className={`w-10 h-10 rounded-full items-center justify-center ${
          light ? 'bg-white/80' : 'bg-gray-800/80'
        }`}
      >
        <ChevronLeft
          size={22}
          color={light ? '#111827' : '#f9fafb'}
          strokeWidth={2.5}
        />
      </Pressable>
    );
  }
);

AuthBackButton.displayName = 'AuthBackButton';
