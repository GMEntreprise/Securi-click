import React, { memo } from 'react';
import { Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

interface Props {
  onPress?: () => void;
}

export const ForgotPasswordButton: React.FC<Props> = memo(({ onPress }) => {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push('/(auth)/forgot-password');
    }
  };

  return (
    <Pressable onPress={handlePress} className="items-center mt-4">
      <Text className="text-primary text-sm font-medium">
        Mot de passe oublié ?
      </Text>
    </Pressable>
  );
});
