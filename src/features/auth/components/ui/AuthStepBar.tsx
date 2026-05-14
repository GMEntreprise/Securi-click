import React, { memo } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/theme';

interface AuthStepBarProps {
  currentStep: number;
  totalSteps: number;
}

export const AuthStepBar: React.FC<AuthStepBarProps> = memo(
  ({ currentStep, totalSteps }) => {
    const t = useTheme();

    return (
      <View style={{ marginBottom: 24 }}>
        <Text
          style={{
            fontSize: 12,
            color: t.textMuted,
            marginBottom: 10,
            fontWeight: '600',
          }}
        >
          Étape {currentStep} sur {totalSteps}
        </Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <StepSegment
              key={i}
              filled={i < currentStep}
              active={i === currentStep - 1}
              color={t.accent}
              trackColor={t.inputBorder}
            />
          ))}
        </View>
      </View>
    );
  }
);

const StepSegment = memo(function StepSegment({
  filled,
  active,
  color,
  trackColor,
}: {
  filled: boolean;
  active: boolean;
  color: string;
  trackColor: string;
}) {
  const fillStyle = useAnimatedStyle(() => ({
    width: withTiming(active ? '100%' : filled ? '100%' : '0%', {
      duration: 350,
    }) as any,
  }));

  return (
    <View
      style={{
        flex: 1,
        height: 4,
        borderRadius: 4,
        backgroundColor: trackColor,
        overflow: 'hidden',
      }}
    >
      {filled && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              backgroundColor: color,
              borderRadius: 4,
            },
            active ? fillStyle : { width: '100%' },
          ]}
        />
      )}
    </View>
  );
});

AuthStepBar.displayName = 'AuthStepBar';
