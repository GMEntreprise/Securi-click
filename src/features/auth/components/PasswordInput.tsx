import React, { memo, useState } from 'react';
import { View, TextInput, TouchableOpacity, Animated } from 'react-native';
import { Controller } from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react-native';
import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

interface Props {
  control: any;
  name: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}

export const PasswordInput: React.FC<Props> = memo(
  ({ control, name, placeholder = '••••••••', error, disabled = false }) => {
    const [show, setShow] = useState(false);
    const eyeAnim = useSharedValue(0);

    const togglePassword = () => {
      const newShow = !show;
      setShow(newShow);
      eyeAnim.value = withSpring(newShow ? 0 : 1, {
        damping: 20,
        stiffness: 300,
      });
    };

    const eyeStyle = useAnimatedStyle(() => ({
      transform: [
        {
          rotate: `${eyeAnim.value * 180}deg`,
        },
        {
          scale: 1 + eyeAnim.value * 0.1,
        },
      ],
    }));

    return (
      <View className="relative">
        <Controller
          control={control}
          name={name}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              className={`h-14 px-4 bg-white dark:bg-gray-900 border-2 rounded-2xl text-gray-900 dark:text-white font-medium ${
                error
                  ? 'border-red-500'
                  : 'border-gray-200 dark:border-gray-700'
              } ${disabled ? 'opacity-50' : ''}`}
              placeholder={placeholder}
              secureTextEntry={!show}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              editable={!disabled}
              placeholderTextColor="#9CA3AF"
              selectionColor="#1E3A8A"
            />
          )}
        />

        <TouchableOpacity
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2"
          onPress={togglePassword}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Animated.View style={eyeStyle}>
            {show ? (
              <EyeOff size={20} color="#6B7280" />
            ) : (
              <Eye size={20} color="#6B7280" />
            )}
          </Animated.View>
        </TouchableOpacity>

        {error && (
          <Animated.View
            entering={() => ({
              opacity: withSpring(1, { damping: 20, stiffness: 300 }),
              transform: [
                { translateY: withSpring(0, { damping: 20, stiffness: 300 }) },
              ],
            })}
            className="mt-1"
          >
            <Text className="text-red-500 text-sm font-medium">{error}</Text>
          </Animated.View>
        )}
      </View>
    );
  }
);
