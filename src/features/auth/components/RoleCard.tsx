import React, { memo } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface Props {
  role: 'parent' | 'collector' | 'school';
  title: string;
  description: string;
  icon: string;
  color: string;
  onPress: () => void;
  delay?: number;
}

export const RoleCard: React.FC<Props> = memo(
  ({ role, title, description, icon, color, onPress, delay = 0 }) => {
    const scaleAnim = useSharedValue(0.8);
    const opacityAnim = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scaleAnim.value }],
      opacity: opacityAnim.value,
    }));

    const handlePress = () => {
      scaleAnim.value = withSpring(0.95, { damping: 15, stiffness: 400 });
      setTimeout(() => {
        scaleAnim.value = withSpring(1, { damping: 15, stiffness: 400 });
        onPress();
      }, 100);
    };

    React.useEffect(() => {
      const timer = setTimeout(() => {
        scaleAnim.value = withSpring(1, { damping: 20, stiffness: 300 });
        opacityAnim.value = withTiming(1, { duration: 300 });
      }, delay);

      return () => clearTimeout(timer);
    }, [delay]);

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handlePress}
        className="flex-1 mx-2"
      >
        <Animated.View
          style={animatedStyle}
          className={`rounded-3xl p-6 ${color} shadow-lg`}
        >
          <View className="items-center mb-4">
            <Text className="text-6xl mb-3">{icon}</Text>
            <Text className="text-white text-xl font-bold text-center">
              {title}
            </Text>
          </View>

          <Text className="text-white/90 text-center text-sm leading-relaxed">
            {description}
          </Text>

          <View className="mt-4 items-center">
            <View className="w-16 h-1 bg-white/30 rounded-full" />
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  }
);
