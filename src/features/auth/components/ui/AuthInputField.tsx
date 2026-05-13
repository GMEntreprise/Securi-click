import React, { memo } from 'react';
import { Text, TextInput, TextInputProps, View } from 'react-native';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { useTheme } from '@/theme';

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
  const t = useTheme();
  const borderColor = error ? t.red : t.inputBorder;

  return (
    <View style={{ marginBottom: 16 }}>
      <Text
        style={{
          fontSize: 11,
          fontWeight: '700',
          color: t.textSecondary,
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
              backgroundColor: t.input,
              borderRadius: 16,
              paddingHorizontal: 16,
              borderWidth: 1.5,
              borderColor,
              minHeight: 56,
            }}
          >
            {icon && <View style={{ marginRight: 10 }}>{icon}</View>}
            <TextInput
              style={{
                flex: 1,
                fontSize: 15,
                color: t.text,
                paddingVertical: 16,
              }}
              value={value as string}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholderTextColor={t.placeholder}
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
          style={{ color: t.red, fontSize: 12, marginTop: 4, marginLeft: 4 }}
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
