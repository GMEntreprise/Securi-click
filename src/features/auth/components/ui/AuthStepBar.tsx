import React, { memo } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

interface AuthStepBarProps {
  currentStep: number;
  totalSteps: number;
  accentColor?: string;
}

export const AuthStepBar: React.FC<AuthStepBarProps> = memo(
  ({ currentStep, totalSteps, accentColor = '#f97316' }) => {
    const progress = currentStep / totalSteps;

    const barStyle = useAnimatedStyle(() => ({
      width: withTiming(`${progress * 100}%` as any, { duration: 350 }),
    }));

    return (
      <View className="mb-6">
        <Text className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Étape {currentStep} sur {totalSteps}
        </Text>
        <View className="flex-row gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View
              key={i}
              className="flex-1 h-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden"
            >
              {i < currentStep && (
                <Animated.View
                  style={[
                    { position: 'absolute', left: 0, top: 0, bottom: 0 },
                    i === currentStep - 1 ? barStyle : { width: '100%' },
                  ]}
                  className="rounded-full"
                />
              )}
              {i < currentStep && (
                <View
                  style={{ backgroundColor: accentColor }}
                  className="absolute inset-0 rounded-full"
                />
              )}
            </View>
          ))}
        </View>
      </View>
    );
  }
);

AuthStepBar.displayName = 'AuthStepBar';
