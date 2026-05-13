import { Eye, EyeOff, Lock } from 'lucide-react-native';
import React, { memo, useCallback, useState } from 'react';
import { Pressable, Text, TextInput, View, useColorScheme } from 'react-native';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';

interface AuthPasswordFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  error?: string;
  rightLabel?: React.ReactNode;
  disabled?: boolean;
}

function AuthPasswordFieldInner<T extends FieldValues>({
  control,
  name,
  label,
  placeholder = '••••••••',
  error,
  rightLabel,
  disabled = false,
}: AuthPasswordFieldProps<T>) {
  const [visible, setVisible] = useState(false);
  const toggle = useCallback(() => setVisible(v => !v), []);
  const dark = useColorScheme() === 'dark';

  const inputBg = dark ? '#1e1e1e' : '#ffffff';
  const inputBorder = error ? '#f87171' : dark ? '#333333' : '#e5e7eb';
  const textColor = dark ? '#f9fafb' : '#111827';
  const labelColor = dark ? '#9ca3af' : '#6b7280';
  const iconColor = dark ? '#4b5563' : '#9ca3af';

  return (
    <View style={{ marginBottom: 16 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <Text
          style={{
            fontSize: 11,
            fontWeight: '700',
            color: labelColor,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          {label}
        </Text>
        {rightLabel}
      </View>
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
              opacity: disabled ? 0.5 : 1,
            }}
          >
            <Lock size={18} color={iconColor} style={{ marginRight: 10 }} />
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
              placeholder={placeholder}
              placeholderTextColor={dark ? '#4b5563' : '#9ca3af'}
              secureTextEntry={!visible}
              editable={!disabled}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable onPress={toggle} hitSlop={12} disabled={disabled}>
              {visible ? (
                <EyeOff size={20} color={iconColor} />
              ) : (
                <Eye size={20} color={iconColor} />
              )}
            </Pressable>
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

export const AuthPasswordField = memo(
  AuthPasswordFieldInner
) as typeof AuthPasswordFieldInner;
