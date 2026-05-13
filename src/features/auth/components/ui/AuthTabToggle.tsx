import React, { memo, useCallback, useRef } from 'react';
import {
  Pressable,
  Text,
  View,
  useColorScheme,
  LayoutChangeEvent,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface AuthTabToggleProps {
  leftLabel: string;
  rightLabel: string;
  activeIndex: 0 | 1;
  onToggle: (index: 0 | 1) => void;
}

export const AuthTabToggle: React.FC<AuthTabToggleProps> = memo(
  ({ leftLabel, rightLabel, activeIndex, onToggle }) => {
    const scheme = useColorScheme();
    const dark = scheme === 'dark';
    const pillX = useSharedValue(0);
    const containerWidth = useSharedValue(0);

    const pillStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: pillX.value }],
    }));

    const handleLayout = useCallback((e: LayoutChangeEvent) => {
      const w = e.nativeEvent.layout.width;
      containerWidth.value = w;
      pillX.value = activeIndex === 0 ? 4 : w / 2 - 4;
    }, []);

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

    const trackBg = dark ? '#161b22' : '#f3f4f6';
    const pillBg = dark ? '#21262d' : '#ffffff';
    const activeText = dark ? '#60a5fa' : '#1e3a8a';
    const inactiveText = dark ? '#6b7280' : '#9ca3af';

    return (
      <View
        onLayout={handleLayout}
        style={{
          marginHorizontal: 24,
          marginTop: 16,
          marginBottom: 8,
          backgroundColor: trackBg,
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
              backgroundColor: pillBg,
              borderRadius: 14,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: dark ? 0.3 : 0.08,
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
              color: activeIndex === 0 ? activeText : inactiveText,
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
              color: activeIndex === 1 ? activeText : inactiveText,
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
