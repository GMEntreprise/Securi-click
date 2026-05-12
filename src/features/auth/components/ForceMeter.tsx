import React, { memo } from 'react';
import { View, Text } from 'react-native';

interface Props {
  strength: 'weak' | 'medium' | 'strong';
}

export const ForceMeter: React.FC<Props> = memo(({ strength }) => {
  const getColor = () => {
    switch (strength) {
      case 'weak':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'strong':
        return 'bg-green-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getLabel = () => {
    switch (strength) {
      case 'weak':
        return 'Faible';
      case 'medium':
        return 'Moyen';
      case 'strong':
        return 'Fort';
      default:
        return '';
    }
  };

  return (
    <View className="mt-2">
      <View className="flex-row gap-1">
        <View className={`h-1 flex-1 rounded-full ${getColor()}`} />
        <View
          className={`h-1 flex-1 rounded-full ${strength !== 'weak' ? getColor() : 'bg-gray-300'}`}
        />
        <View
          className={`h-1 flex-1 rounded-full ${strength === 'strong' ? getColor() : 'bg-gray-300'}`}
        />
      </View>
      <Text className="text-xs text-muted-foreground mt-1">{getLabel()}</Text>
    </View>
  );
});
