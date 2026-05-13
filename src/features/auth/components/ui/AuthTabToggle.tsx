import React, { memo, useCallback } from 'react';
import { Pressable, Text, View, LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/theme';

interface AuthTabToggleProps {
  leftLabel: string;
  rightLabel: string;
  activeIndex: 0 | 1;
  onToggle: (index: 0 | 1) => void;
}

export const AuthTabToggle: React.FC<AuthTabToggleProps> = memo(
  ({ leftLabel, rightLabel, activeIndex, onToggle }) => {
    const t = useTheme();
    const pillX = useSharedValue(0);
    const containerWidth = useSharedValue(0);

    const pillStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: pillX.value }],
    }));

    const handleLayout = useCallback(
      (e: LayoutChangeEvent) => {
        const w = e.nativeEvent.layout.width;
        containerWidth.value = w;
        pillX.value = activeIndex === 0 ? 4 : w / 2 - 4;
      },
      [activeIndex, containerWidth, pillX]
    );

    const handlePress = useCallback(
      (index: 0 | 1) => {
        const half = containerWidth.value / 2;
        pillX.value = withTiming(index === 0 ? 4 : half - 4, {
          duration: 200,
          easing: Easing.out(Easing.cubic),
        });
        onToggle(index);
      },
      [onToggle, containerWidth, pillX]
    );

    return (
      <View
        onLayout={handleLayout}
        style={{
          marginHorizontal: 24,
          marginTop: 16,
          marginBottom: 8,
          backgroundColor: t.iconBg,
          borderRadius: 18,
          padding: 4,
          flexDirection: 'row',
          position: 'relative',
        }}
      >
        <Animated.View
          style={[
            pillStyle,
            {
              position: 'absolute',
              top: 4,
              bottom: 4,
              width: '50%',
              backgroundColor: t.card,
              borderRadius: 14,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: t.isDark ? 0.3 : 0.08,
              shadowRadius: 4,
              elevation: 2,
            },
          ]}
        />
        <Pressable
          onPress={() => handlePress(0)}
          style={{ flex: 1, paddingVertical: 12, alignItems: 'center' }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: '700',
              color: activeIndex === 0 ? t.primary : t.textMuted,
            }}
          >
            {leftLabel}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => handlePress(1)}
          style={{ flex: 1, paddingVertical: 12, alignItems: 'center' }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: '700',
              color: activeIndex === 1 ? t.primary : t.textMuted,
            }}
          >
            {rightLabel}
          </Text>
        </Pressable>
      </View>
    );
  }
);

AuthTabToggle.displayName = 'AuthTabToggle';
