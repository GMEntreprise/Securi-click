import { Check } from 'lucide-react-native';
import React, { memo, useCallback } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';

interface AuthCheckboxProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: React.ReactNode;
  error?: string;
  accentColor?: string;
}

function AuthCheckboxInner<T extends FieldValues>({
  control,
  name,
  label,
  error,
  accentColor = '#f97316',
}: AuthCheckboxProps<T>) {
  return (
    <View className="mb-3">
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, value } }) => (
          <Pressable
            onPress={() => onChange(!value)}
            className="flex-row items-start gap-3"
            hitSlop={8}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 6,
                borderWidth: 2,
                borderColor: value ? accentColor : '#d1d5db',
                backgroundColor: value ? accentColor : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 2,
              }}
            >
              {value && <Check size={12} color="#fff" strokeWidth={3} />}
            </View>
            <View className="flex-1">
              {typeof label === 'string' ? (
                <Text className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {label}
                </Text>
              ) : (
                label
              )}
            </View>
          </Pressable>
        )}
      />
      {error && <Text className="text-red-500 text-xs mt-1 ml-8">{error}</Text>}
    </View>
  );
}

export const AuthCheckbox = memo(AuthCheckboxInner) as typeof AuthCheckboxInner;
