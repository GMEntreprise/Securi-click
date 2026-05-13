import React, { memo } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

type Strength = 'weak' | 'medium' | 'strong';

const STRENGTH_CONFIG: Record<
  Strength,
  { label: string; color: string; bars: number }
> = {
  weak: { label: 'Faible', color: '#ef4444', bars: 1 },
  medium: { label: 'Moyen', color: '#f97316', bars: 2 },
  strong: { label: 'Fort', color: '#10b981', bars: 3 },
};

interface PasswordStrengthBarProps {
  strength: Strength;
}

export const PasswordStrengthBar: React.FC<PasswordStrengthBarProps> = memo(
  ({ strength }) => {
    const config = STRENGTH_CONFIG[strength];

    return (
      <View className="mt-2 mb-1">
        <View className="flex-row gap-1.5 mb-1">
          {[1, 2, 3].map(i => (
            <View
              key={i}
              className="flex-1 h-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden"
            >
              {i <= config.bars && (
                <View
                  style={{ backgroundColor: config.color }}
                  className="absolute inset-0 rounded-full"
                />
              )}
            </View>
          ))}
        </View>
        <Text style={{ color: config.color }} className="text-xs font-medium">
          Force du mot de passe :{' '}
          <Text style={{ color: config.color }} className="font-bold">
            {config.label}
          </Text>
        </Text>
      </View>
    );
  }
);

PasswordStrengthBar.displayName = 'PasswordStrengthBar';
