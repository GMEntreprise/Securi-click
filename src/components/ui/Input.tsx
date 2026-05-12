import React, { memo } from 'react';
import { Controller } from 'react-hook-form';
import { Text, TextInput, View } from 'react-native';

interface InputProps {
  label?: string;
  placeholder?: string;
  control: any;
  name: string;
  error?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: 'off' | 'email' | 'password' | 'tel';
  editable?: boolean;
}

export const Input: React.FC<InputProps> = memo(
  ({
    label,
    placeholder,
    control,
    name,
    error,
    keyboardType = 'default',
    secureTextEntry = false,
    autoCapitalize = 'sentences',
    autoComplete = 'off',
    editable = true,
  }) => {
    return (
      <View className="space-y-2">
        {label && (
          <Text className="text-gray-900 dark:text-gray-100 text-sm font-medium mb-1">
            {label}
          </Text>
        )}

        <Controller
          control={control}
          name={name}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              className={`border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-3 text-gray-900 dark:text-white bg-white dark:bg-gray-900 ${
                error ? 'border-red-500' : ''
              }`}
              placeholder={placeholder}
              keyboardType={keyboardType}
              autoCapitalize={autoCapitalize}
              autoComplete={autoComplete}
              secureTextEntry={secureTextEntry}
              editable={editable}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />

        {error && <Text className="text-red-500 text-xs mt-1">{error}</Text>}
      </View>
    );
  }
);
