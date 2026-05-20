import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Clipboard,
} from 'react-native';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Eye, EyeOff, Lock, RefreshCw, ShieldAlert } from 'lucide-react-native';
import { useTheme } from '@/theme';

const TRIVIAL_PINS = new Set([
  '000000','111111','222222','333333','444444','555555',
  '666666','777777','888888','999999','123456','654321',
  '012345','098765','111222','123123',
]);

export function generateSecurePin(): string {
  let pin: string;
  do {
    const arr = new Uint32Array(1);
    // crypto.getRandomValues is available in Hermes / JSC via React Native
    // Falls back to Math.random only in test environments
    const val =
      typeof crypto !== 'undefined'
        ? (crypto.getRandomValues(arr), arr[0] % 1_000_000)
        : Math.floor(Math.random() * 1_000_000);
    pin = String(val).padStart(6, '0');
  } while (TRIVIAL_PINS.has(pin));
  return pin;
}

interface PinAccessSectionProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  error?: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  hideToggle?: boolean;
}

const AUTO_HIDE_MS = 8_000;

function PinAccessSectionInner<T extends FieldValues>({
  control,
  name,
  error,
  enabled,
  onToggle,
  hideToggle = false,
}: PinAccessSectionProps<T>) {
    const theme = useTheme();
    const [visible, setVisible] = useState(false);
    const [copied, setCopied] = useState(false);
    const autoHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const clipboardTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const shakeX = useSharedValue(0);

    const shakeStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: shakeX.value }],
    }));

    const clearTimers = useCallback(() => {
      if (autoHideTimer.current) clearTimeout(autoHideTimer.current);
      if (clipboardTimer.current) clearTimeout(clipboardTimer.current);
    }, []);

    useEffect(() => () => clearTimers(), [clearTimers]);

    const scheduleAutoHide = useCallback(() => {
      clearTimers();
      autoHideTimer.current = setTimeout(() => setVisible(false), AUTO_HIDE_MS);
    }, [clearTimers]);

    const handleReveal = useCallback(() => {
      setVisible(v => {
        if (!v) scheduleAutoHide();
        else clearTimers();
        return !v;
      });
    }, [scheduleAutoHide, clearTimers]);

    return (
      <View
        style={{
          backgroundColor: theme.card,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: enabled
            ? 'rgba(249,115,22,0.3)'
            : theme.cardBorder,
          overflow: 'hidden',
        }}
      >
        {/* Toggle row */}
        <TouchableOpacity
          onPress={() => {
            if (hideToggle) return;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onToggle(!enabled);
            if (!enabled) setVisible(false);
          }}
          activeOpacity={hideToggle ? 1 : 0.8}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            gap: 12,
          }}
        >
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: enabled ? theme.accentBg : theme.iconBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Lock
              size={17}
              color={enabled ? theme.accent : theme.textMuted}
              strokeWidth={2.5}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}
            >
              Code de connexion sécurisé
            </Text>
            <Text
              style={{ color: theme.textMuted, fontSize: 12, marginTop: 1 }}
            >
              {"6 chiffres — obligatoire, partagez-le en privé"}
            </Text>
          </View>
          {!hideToggle && (
            <View
              style={{
                width: 44,
                height: 26,
                borderRadius: 13,
                backgroundColor: enabled ? theme.accent : theme.switchTrackOff,
                justifyContent: 'center',
                paddingHorizontal: 3,
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: '#fff',
                  alignSelf: enabled ? 'flex-end' : 'flex-start',
                }}
              />
            </View>
          )}
        </TouchableOpacity>

        {enabled && (
          <Animated.View
            entering={FadeInDown.duration(250)}
            style={{
              borderTopWidth: 1,
              borderTopColor: theme.separator,
              padding: 16,
              gap: 12,
            }}
          >
            {/* Security tip */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 8,
                backgroundColor: theme.amberBg,
                borderRadius: 12,
                padding: 10,
              }}
            >
              <ShieldAlert
                size={14}
                color={theme.amber}
                strokeWidth={2}
                style={{ marginTop: 1 }}
              />
              <Text
                style={{
                  flex: 1,
                  fontSize: 11,
                  color: theme.textSecondary,
                  lineHeight: 16,
                }}
              >
                Recommandé : 6 chiffres aléatoires. N'utilisez pas une date de naissance.
              </Text>
            </View>

            {/* PIN input */}
            <Controller
              control={control}
              name={name}
              render={({ field: { onChange, value } }) => {
                const handleGenerate = () => {
                  const pin = generateSecurePin();
                  onChange(pin);
                  setVisible(true);
                  scheduleAutoHide();
                  Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Success
                  );
                  shakeX.value = withSequence(
                    withTiming(-4, { duration: 50 }),
                    withTiming(4, { duration: 50 }),
                    withTiming(-4, { duration: 50 }),
                    withTiming(0, { duration: 50 })
                  );
                };

                const handleCopy = () => {
                  if (!value) return;
                  Clipboard.setString(value);
                  setCopied(true);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  clipboardTimer.current = setTimeout(() => {
                    Clipboard.setString('');
                    setCopied(false);
                  }, 30_000);
                };

                return (
                  <View style={{ gap: 10 }}>
                    <Animated.View
                      style={[
                        shakeStyle,
                        {
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: theme.input,
                          borderRadius: 14,
                          borderWidth: 1.5,
                          borderColor: error ? theme.red : theme.inputBorder,
                          paddingHorizontal: 14,
                          minHeight: 52,
                          gap: 8,
                        },
                      ]}
                    >
                      <Lock size={16} color={theme.textMuted} strokeWidth={2} />
                      <TextInput
                        value={value ?? ''}
                        onChangeText={t => {
                          const digits = t.replace(/\D/g, '').slice(0, 6);
                          onChange(digits);
                        }}
                        keyboardType="number-pad"
                        maxLength={6}
                        secureTextEntry={!visible}
                        contextMenuHidden
                        style={{
                          flex: 1,
                          fontSize: visible ? 22 : 18,
                          color: theme.text,
                          letterSpacing: visible ? 8 : 4,
                          paddingVertical: 12,
                        }}
                        placeholderTextColor={theme.placeholder}
                        placeholder={visible ? '------' : '••••••'}
                      />
                      <TouchableOpacity
                        onPress={handleReveal}
                        hitSlop={8}
                      >
                        {visible ? (
                          <EyeOff size={18} color={theme.textMuted} />
                        ) : (
                          <Eye size={18} color={theme.textMuted} />
                        )}
                      </TouchableOpacity>
                    </Animated.View>

                    {error ? (
                      <Text
                        style={{ color: theme.red, fontSize: 12, marginLeft: 2 }}
                      >
                        {error}
                      </Text>
                    ) : null}

                    {/* Actions row */}
                    <View
                      style={{ flexDirection: 'row', gap: 8 }}
                    >
                      <TouchableOpacity
                        onPress={handleGenerate}
                        style={{
                          flex: 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          backgroundColor: theme.iconBg,
                          borderRadius: 12,
                          paddingVertical: 10,
                          borderWidth: 1,
                          borderColor: theme.cardBorder,
                        }}
                      >
                        <RefreshCw size={14} color={theme.textSecondary} strokeWidth={2.5} />
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: '600',
                            color: theme.textSecondary,
                          }}
                        >
                          Générer
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={handleCopy}
                        disabled={!value}
                        style={{
                          flex: 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          backgroundColor: copied
                            ? theme.greenBg
                            : theme.iconBg,
                          borderRadius: 12,
                          paddingVertical: 10,
                          borderWidth: 1,
                          borderColor: copied
                            ? 'rgba(16,185,129,0.3)'
                            : theme.cardBorder,
                          opacity: value ? 1 : 0.4,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: '600',
                            color: copied ? theme.green : theme.textSecondary,
                          }}
                        >
                          {copied ? 'Copié ✓' : 'Copier'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {visible && value ? (
                      <Text
                        style={{
                          fontSize: 11,
                          color: theme.amber,
                          textAlign: 'center',
                          fontWeight: '600',
                        }}
                      >
                        Code visible — masquage automatique dans 8 secondes
                      </Text>
                    ) : null}
                  </View>
                );
              }}
            />
          </Animated.View>
        )}
      </View>
    );
}

export const PinAccessSection = memo(
  PinAccessSectionInner
) as typeof PinAccessSectionInner;
