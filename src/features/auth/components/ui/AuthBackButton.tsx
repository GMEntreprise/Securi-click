import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';

interface AuthBackButtonProps {
  onPress: () => void;
}

export const AuthBackButton: React.FC<AuthBackButtonProps> = memo(
  ({ onPress }) => {
    const insets = useSafeAreaInsets();
    const t = useTheme();

    return (
      <Pressable
        onPress={onPress}
        hitSlop={12}
        style={{
          position: 'absolute',
          top: insets.top + 12,
          left: 16,
          zIndex: 10,
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: t.card,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: t.cardBorder,
        }}
      >
        <Ionicons name="chevron-back" size={22} color={t.text} />
      </Pressable>
    );
  }
);

AuthBackButton.displayName = 'AuthBackButton';
