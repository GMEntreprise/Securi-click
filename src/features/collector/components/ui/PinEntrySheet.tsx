import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Eye, EyeOff, Lock, ShieldAlert, X } from 'lucide-react-native';
import { useTheme } from '@/theme';
import type { PendingInvite } from '../../hooks/useCollector';

interface PinEntrySheetProps {
  invite: PendingInvite;
  onSubmit: (token: string, pin: string) => void;
  onDismiss: () => void;
  isLoading: boolean;
  error: string | null;
}

const AUTO_HIDE_MS = 8_000;

export const PinEntrySheet = memo(function PinEntrySheet({
  invite,
  onSubmit,
  onDismiss,
  isLoading,
  error,
}: PinEntrySheetProps) {
  const theme = useTheme();
  const [pin, setPin] = useState('');
  const [visible, setVisible] = useState(false);
  const autoHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shakeX = useSharedValue(0);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  useEffect(() => {
    return () => {
      if (autoHideTimer.current) clearTimeout(autoHideTimer.current);
    };
  }, []);

  const handleReveal = useCallback(() => {
    setVisible(v => {
      if (!v) {
        if (autoHideTimer.current) clearTimeout(autoHideTimer.current);
        autoHideTimer.current = setTimeout(() => setVisible(false), AUTO_HIDE_MS);
      } else {
        if (autoHideTimer.current) clearTimeout(autoHideTimer.current);
      }
      return !v;
    });
  }, []);

  const handleSubmit = useCallback(() => {
    if (pin.length !== 6) {
      shakeX.value = withSequence(
        withTiming(-6, { duration: 60 }),
        withTiming(6, { duration: 60 }),
        withTiming(-6, { duration: 60 }),
        withTiming(0, { duration: 60 })
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSubmit(invite.invitation_token, pin);
  }, [pin, invite.invitation_token, onSubmit, shakeX]);

  const childName = invite.child
    ? `${invite.child.first_name} ${invite.child.last_name}`
    : null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        {/* Handle */}
        <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: theme.inputBorder,
            }}
          />
        </View>

        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 14,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: theme.textMuted,
                fontSize: 11,
                fontWeight: '700',
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                marginBottom: 3,
              }}
            >
              Invitation reçue
            </Text>
            <Text
              style={{ color: theme.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.3 }}
            >
              Code de sécurité
            </Text>
          </View>
          <TouchableOpacity
            onPress={onDismiss}
            disabled={isLoading}
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              backgroundColor: theme.iconBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: 20, gap: 16 }}>
          {/* Context card */}
          <Animated.View entering={FadeInDown.duration(300)}>
            <View
              style={{
                backgroundColor: theme.card,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: theme.cardBorder,
                padding: 16,
                gap: 4,
              }}
            >
              <Text style={{ color: theme.textMuted, fontSize: 12, fontWeight: '600' }}>
                Autorisation pour
              </Text>
              {childName ? (
                <Text style={{ color: theme.text, fontSize: 16, fontWeight: '700' }}>
                  {childName}
                </Text>
              ) : null}
              <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                {invite.first_name} {invite.last_name} · {invite.relationship}
              </Text>
            </View>
          </Animated.View>

          {/* Security notice */}
          <Animated.View
            entering={FadeInDown.delay(60).duration(300)}
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 8,
              backgroundColor: theme.amberBg,
              borderRadius: 12,
              padding: 12,
            }}
          >
            <ShieldAlert size={14} color={theme.amber} strokeWidth={2} style={{ marginTop: 1 }} />
            <Text
              style={{ flex: 1, fontSize: 12, color: theme.textSecondary, lineHeight: 17 }}
            >
              Le parent qui vous a invité vous a communiqué ce code à 6 chiffres en privé.
            </Text>
          </Animated.View>

          {/* PIN input */}
          <Animated.View entering={FadeInDown.delay(120).duration(300)}>
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
                  minHeight: 56,
                  gap: 10,
                },
              ]}
            >
              <Lock size={16} color={theme.textMuted} strokeWidth={2} />
              <TextInput
                value={pin}
                onChangeText={t => setPin(t.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
                secureTextEntry={!visible}
                contextMenuHidden
                autoFocus
                style={{
                  flex: 1,
                  fontSize: visible ? 24 : 20,
                  color: theme.text,
                  letterSpacing: visible ? 10 : 6,
                  paddingVertical: 14,
                }}
                placeholderTextColor={theme.placeholder}
                placeholder={visible ? '——————' : '••••••'}
                editable={!isLoading}
              />
              <TouchableOpacity onPress={handleReveal} hitSlop={10} disabled={isLoading}>
                {visible ? (
                  <EyeOff size={18} color={theme.textMuted} />
                ) : (
                  <Eye size={18} color={theme.textMuted} />
                )}
              </TouchableOpacity>
            </Animated.View>

            {visible ? (
              <Text
                style={{
                  fontSize: 11,
                  color: theme.amber,
                  textAlign: 'center',
                  fontWeight: '600',
                  marginTop: 6,
                }}
              >
                Code visible — masquage dans 8 secondes
              </Text>
            ) : null}

            {error ? (
              <Text style={{ color: theme.red, fontSize: 13, marginTop: 8, textAlign: 'center' }}>
                {error}
              </Text>
            ) : null}
          </Animated.View>

          {/* CTA */}
          <Animated.View entering={FadeInDown.delay(180).duration(300)}>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isLoading || pin.length !== 6}
              style={{
                backgroundColor: theme.accent,
                borderRadius: 18,
                paddingVertical: 16,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
                opacity: isLoading || pin.length !== 6 ? 0.55 : 1,
              }}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Lock size={16} color="#fff" strokeWidth={2.5} />
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
                    Confirmer l'accès
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
});
