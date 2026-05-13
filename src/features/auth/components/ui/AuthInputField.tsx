import React, { memo } from 'react';
import {
  Text,
  TextInput,
  TextInputProps,
  View,
  useColorScheme,
} from 'react-native';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';

interface AuthInputFieldProps<T extends FieldValues> extends TextInputProps {
  control: Control<T>;
  name: Path<T>;
  label: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  error?: string;
}

function AuthInputFieldInner<T extends FieldValues>({
  control,
  name,
  label,
  icon,
  rightElement,
  error,
  ...textInputProps
}: AuthInputFieldProps<T>) {
  const dark = useColorScheme() === 'dark';

  const inputBg = dark ? '#1e1e1e' : '#ffffff';
  const inputBorder = error ? '#f87171' : dark ? '#333333' : '#e5e7eb';
  const textColor = dark ? '#f9fafb' : '#111827';
  const labelColor = dark ? '#9ca3af' : '#6b7280';

  return (
    <View style={{ marginBottom: 16 }}>
      <Text
        style={{
          fontSize: 11,
          fontWeight: '700',
          color: labelColor,
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 8,
        }}
      >
        {label}
      </Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: inputBg,
              borderRadius: 16,
              paddingHorizontal: 16,
              borderWidth: 1.5,
              borderColor: inputBorder,
              minHeight: 56,
            }}
          >
            {icon && <View style={{ marginRight: 10 }}>{icon}</View>}
            <TextInput
              style={{
                flex: 1,
                fontSize: 15,
                color: textColor,
                paddingVertical: 16,
              }}
              value={value as string}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholderTextColor={dark ? '#4b5563' : '#9ca3af'}
              {...textInputProps}
            />
            {rightElement && (
              <View style={{ marginLeft: 8 }}>{rightElement}</View>
            )}
          </View>
        )}
      />
      {error && (
        <Text
          style={{
            color: '#f87171',
            fontSize: 12,
            marginTop: 4,
            marginLeft: 4,
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}

export const AuthInputField = memo(
  AuthInputFieldInner
) as typeof AuthInputFieldInner;
