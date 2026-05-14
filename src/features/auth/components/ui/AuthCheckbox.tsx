import { Check } from 'lucide-react-native';
import React, { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { useTheme } from '@/theme';

interface AuthCheckboxProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: React.ReactNode;
  error?: string;
}

function AuthCheckboxInner<T extends FieldValues>({
  control,
  name,
  label,
  error,
}: AuthCheckboxProps<T>) {
  const t = useTheme();

  return (
    <View style={{ marginBottom: 12 }}>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, value } }) => (
          <Pressable
            onPress={() => onChange(!value)}
            hitSlop={8}
            style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 6,
                borderWidth: 2,
                borderColor: value ? t.accent : t.inputBorder,
                backgroundColor: value ? t.accent : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 2,
              }}
            >
              {value && <Check size={12} color="#fff" strokeWidth={3} />}
            </View>
            <View style={{ flex: 1 }}>
              {typeof label === 'string' ? (
                <Text
                  style={{
                    fontSize: 13,
                    color: t.textSecondary,
                    lineHeight: 20,
                  }}
                >
                  {label}
                </Text>
              ) : (
                label
              )}
            </View>
          </Pressable>
        )}
      />
      {error && (
        <Text
          style={{
            color: t.red,
            fontSize: 12,
            marginTop: 4,
            marginLeft: 32,
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}

export const AuthCheckbox = memo(AuthCheckboxInner) as typeof AuthCheckboxInner;
