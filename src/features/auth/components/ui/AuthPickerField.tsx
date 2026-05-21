import React, { memo, useCallback, useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme';

interface AuthPickerFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  options: string[];
  icon?: React.ReactNode;
  placeholder?: string;
  error?: string;
}

function AuthPickerFieldInner<T extends FieldValues>({
  control,
  name,
  label,
  options,
  icon,
  placeholder = 'Sélectionner…',
  error,
}: AuthPickerFieldProps<T>) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  const handleOpen = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => setOpen(false), []);

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
        render={({ field: { onChange, value } }) => (
          <>
            <TouchableOpacity
              onPress={handleOpen}
              activeOpacity={0.75}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: t.input,
                borderRadius: 16,
                paddingHorizontal: 16,
                borderWidth: 1.5,
                borderColor: error ? t.red : value ? t.accent : t.inputBorder,
                minHeight: 56,
              }}
            >
              {icon && <View style={{ marginRight: 10 }}>{icon}</View>}
              <Text
                style={{
                  flex: 1,
                  fontSize: 15,
                  color: value ? t.text : t.placeholder,
                  paddingVertical: 16,
                }}
                numberOfLines={1}
              >
                {value || placeholder}
              </Text>
              <Ionicons
                name="chevron-down"
                size={18}
                color={value ? t.accent : t.textMuted}
              />
            </TouchableOpacity>

            <Modal
              visible={open}
              transparent
              animationType="slide"
              onRequestClose={handleClose}
            >
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }}
                activeOpacity={1}
                onPress={handleClose}
              />
              <View
                style={{
                  backgroundColor: t.card,
                  borderTopLeftRadius: 28,
                  borderTopRightRadius: 28,
                  paddingTop: 12,
                  paddingBottom: insets.bottom + 24,
                  maxHeight: '75%',
                }}
              >
                {/* Handle */}
                <View style={{ alignItems: 'center', marginBottom: 16 }}>
                  <View
                    style={{
                      width: 40,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: t.inputBorder,
                    }}
                  />
                </View>

                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: '800',
                    color: t.text,
                    paddingHorizontal: 20,
                    marginBottom: 12,
                    letterSpacing: -0.3,
                  }}
                >
                  {label}
                </Text>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                  contentContainerStyle={{ paddingHorizontal: 16, gap: 6 }}
                >
                  {options.map(opt => {
                    const selected = value === opt;
                    return (
                      <TouchableOpacity
                        key={opt}
                        onPress={() => {
                          Haptics.impactAsync(
                            Haptics.ImpactFeedbackStyle.Light
                          );
                          onChange(opt);
                          handleClose();
                        }}
                        activeOpacity={0.75}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 14,
                          paddingHorizontal: 16,
                          borderRadius: 16,
                          borderWidth: 1.5,
                          borderColor: selected ? t.accent : t.cardBorder,
                          backgroundColor: selected
                            ? t.isDark
                              ? 'rgba(249,115,22,0.12)'
                              : 'rgba(249,115,22,0.08)'
                            : t.bg,
                        }}
                      >
                        <Text
                          style={{
                            flex: 1,
                            fontSize: 15,
                            fontWeight: selected ? '700' : '500',
                            color: selected ? t.accent : t.text,
                          }}
                        >
                          {opt}
                        </Text>
                        {selected && (
                          <Ionicons
                            name="checkmark"
                            size={18}
                            color={t.accent}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </Modal>
          </>
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

export const AuthPickerField = memo(
  AuthPickerFieldInner
) as typeof AuthPickerFieldInner;
