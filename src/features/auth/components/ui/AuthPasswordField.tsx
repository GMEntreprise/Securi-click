import { Ionicons } from '@expo/vector-icons';
import React, { memo, useCallback, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { useTheme } from '@/theme';

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
  const t = useTheme();
  const borderColor = error ? t.red : t.inputBorder;

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
            color: t.textSecondary,
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
              backgroundColor: t.input,
              borderRadius: 16,
              paddingHorizontal: 16,
              borderWidth: 1.5,
              borderColor,
              minHeight: 56,
              opacity: disabled ? 0.5 : 1,
            }}
          >
            <Ionicons
              name="lock-closed-outline"
              size={18}
              color={t.textMuted}
              style={{ marginRight: 10 }}
            />
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
              placeholder={placeholder}
              placeholderTextColor={t.placeholder}
              secureTextEntry={!visible}
              editable={!disabled}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable onPress={toggle} hitSlop={12} disabled={disabled}>
              {visible ? (
                <Ionicons
                  name="eye-off-outline"
                  size={20}
                  color={t.textMuted}
                />
              ) : (
                <Ionicons name="eye-outline" size={20} color={t.textMuted} />
              )}
            </Pressable>
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

export const AuthPasswordField = memo(
  AuthPasswordFieldInner
) as typeof AuthPasswordFieldInner;
