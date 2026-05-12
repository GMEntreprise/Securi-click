import React, { memo } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

interface Props {
  message?: string;
}

export const LoadingScreen: React.FC<Props> = memo(
  ({ message = 'Chargement...' }) => {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <View className="items-center space-y-4">
          <ActivityIndicator size="large" color="#208AEF" />
          <Text className="text-muted-foreground text-center">{message}</Text>
        </View>
      </View>
    );
  }
);
