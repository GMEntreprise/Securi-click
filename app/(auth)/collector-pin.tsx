import React, { memo, useCallback, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme';
import {
  useCollectorPinLogin,
  formatPinError,
} from '@/features/collector/hooks/useCollectorPinLogin';
import { useCollectorSessionStore } from '@/features/collector/stores/collectorSession.store';

const AUTO_HIDE_MS = 8_000;

export default memo(function CollectorPinScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const markVerified = useCollectorSessionStore(s => s.markVerified);

  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [visible, setVisible] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [pinFocused, setPinFocused] = useState(false);
  const autoHideRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pinRef = useRef<TextInput>(null);
  const shakeX = useSharedValue(0);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const triggerShake = useCallback(() => {
    shakeX.value = withSequence(
      withTiming(-8, { duration: 55 }),
      withTiming(8, { duration: 55 }),
      withTiming(-6, { duration: 55 }),
      withTiming(6, { duration: 55 }),
      withTiming(0, { duration: 55 })
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, [shakeX]);

  const {
    mutate: pinLogin,
    isPending,
    error: loginError,
    reset: resetLogin,
  } = useCollectorPinLogin(markVerified);

  const errorMsg = loginError ? formatPinError(loginError.message) : null;

  const handleReveal = useCallback(() => {
    setVisible(v => {
      if (!v) {
        if (autoHideRef.current) clearTimeout(autoHideRef.current);
        autoHideRef.current = setTimeout(() => setVisible(false), AUTO_HIDE_MS);
      } else {
        if (autoHideRef.current) clearTimeout(autoHideRef.current);
      }
      return !v;
    });
  }, []);

  const handleSubmit = useCallback(() => {
    Keyboard.dismiss();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || pin.length !== 6) {
      triggerShake();
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    pinLogin({ email: trimmedEmail, pin });
  }, [email, pin, pinLogin, triggerShake]);

  const handleChangePin = useCallback(
    (text: string) => {
      setPin(text.replace(/\D/g, '').slice(0, 6));
      if (loginError) resetLogin();
    },
    [loginError, resetLogin]
  );

  const handleChangeEmail = useCallback(
    (text: string) => {
      setEmail(text);
      if (loginError) resetLogin();
    },
    [loginError, resetLogin]
  );

  const handleEmailSubmit = useCallback(() => {
    pinRef.current?.focus();
  }, []);

  const isReady = email.trim().length > 0 && pin.length === 6;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: t.bg }}
      keyboardVerticalOffset={0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Hero header */}
          <Animated.View entering={FadeInDown.duration(400)}>
            <LinearGradient
              colors={
                t.isDark
                  ? [
                      'rgba(249,115,22,0.18)',
                      'rgba(249,115,22,0.04)',
                      'transparent',
                    ]
                  : [
                      'rgba(249,115,22,0.10)',
                      'rgba(249,115,22,0.02)',
                      'transparent',
                    ]
              }
              locations={[0, 0.6, 1]}
              style={{
                paddingTop: insets.top + 16,
                paddingBottom: 28,
                paddingHorizontal: 24,
                alignItems: 'center',
              }}
            >
              {/* Back natif — router.back() = back du stack Expo Router */}
              <TouchableOpacity
                onPress={() => router.replace('/(auth)')}
                hitSlop={14}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  alignSelf: 'flex-start',
                  marginBottom: 28,
                  width: '100%',
                }}
              >
                <Ionicons name="chevron-back" size={20} color={t.textMuted} />
                <Text
                  style={{
                    fontSize: 15,
                    color: t.textMuted,
                    fontWeight: '500',
                  }}
                >
                  Retour
                </Text>
              </TouchableOpacity>

              {/* Icône centrée */}
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 20,
                  backgroundColor: t.accentBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                }}
              >
                <Ionicons name="shield-checkmark" size={28} color={t.accent} />
              </View>

              {/* Titre + sous-titre centrés */}
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: '800',
                  color: t.text,
                  letterSpacing: -0.5,
                  marginBottom: 8,
                  textAlign: 'center',
                }}
              >
                Espace collecteur
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  color: t.textSecondary,
                  lineHeight: 22,
                  textAlign: 'center',
                }}
              >
                Entrez votre email et le code de connexion communiqué par le
                parent.
              </Text>
            </LinearGradient>
          </Animated.View>

          {/* Formulaire */}
          <View
            style={{
              paddingHorizontal: 24,
              paddingBottom: insets.bottom + 32,
              gap: 12,
            }}
          >
            {/* Notice amber */}
            <Animated.View
              entering={FadeInDown.delay(60).duration(300)}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 8,
                backgroundColor: t.amberBg,
                borderRadius: 12,
                padding: 12,
              }}
            >
              <Ionicons
                name="shield-outline"
                size={14}
                color={t.amber}
                style={{ marginTop: 1 }}
              />
              <Text
                style={{
                  flex: 1,
                  fontSize: 12,
                  color: t.textSecondary,
                  lineHeight: 17,
                }}
              >
                Ce code à 6 chiffres vous a été communiqué par le parent qui
                vous a autorisé.
              </Text>
            </Animated.View>

            {/* Champ email */}
            <Animated.View entering={FadeInDown.delay(80).duration(320)}>
              <InputLabel label="Email" />
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: t.input,
                  borderRadius: 16,
                  borderWidth: 1.5,
                  borderColor: emailFocused ? t.accent : t.inputBorder,
                  paddingHorizontal: 14,
                  minHeight: 56,
                  gap: 10,
                }}
              >
                <Ionicons
                  name="mail-outline"
                  size={17}
                  color={emailFocused ? t.accent : t.textMuted}
                />
                <TextInput
                  value={email}
                  onChangeText={handleChangeEmail}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  onSubmitEditing={handleEmailSubmit}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  returnKeyType="next"
                  placeholder="votre@email.com"
                  placeholderTextColor={t.placeholder}
                  editable={!isPending}
                  style={{
                    flex: 1,
                    fontSize: 15,
                    color: t.text,
                    paddingVertical: 14,
                  }}
                />
              </View>
            </Animated.View>

            {/* Champ code */}
            <Animated.View entering={FadeInDown.delay(130).duration(320)}>
              <InputLabel label="Votre code" />
              <Animated.View
                style={[
                  shakeStyle,
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: t.input,
                    borderRadius: 16,
                    borderWidth: 1.5,
                    borderColor: errorMsg
                      ? t.red
                      : pinFocused
                        ? t.accent
                        : t.inputBorder,
                    paddingHorizontal: 14,
                    minHeight: 56,
                    gap: 10,
                  },
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={17}
                  color={errorMsg ? t.red : pinFocused ? t.accent : t.textMuted}
                />
                <TextInput
                  ref={pinRef}
                  value={pin}
                  onChangeText={handleChangePin}
                  onFocus={() => setPinFocused(true)}
                  onBlur={() => setPinFocused(false)}
                  onSubmitEditing={handleSubmit}
                  keyboardType="number-pad"
                  maxLength={6}
                  secureTextEntry={!visible}
                  contextMenuHidden
                  returnKeyType="done"
                  editable={!isPending}
                  placeholder={visible ? '——————' : '••••••'}
                  placeholderTextColor={t.placeholder}
                  style={{
                    flex: 1,
                    fontSize: visible ? 24 : 20,
                    color: t.text,
                    letterSpacing: visible ? 10 : 6,
                    paddingVertical: 14,
                  }}
                />
                <TouchableOpacity
                  onPress={handleReveal}
                  hitSlop={12}
                  disabled={isPending}
                >
                  <Ionicons
                    name={visible ? 'eye-off-outline' : 'eye-outline'}
                    size={19}
                    color={t.textMuted}
                  />
                </TouchableOpacity>
              </Animated.View>

              {/* Microcopy */}
              {visible ? (
                <Text
                  style={{
                    fontSize: 11,
                    color: t.amber,
                    marginTop: 6,
                    marginLeft: 2,
                    fontWeight: '600',
                  }}
                >
                  Masquage dans 8 s
                </Text>
              ) : errorMsg ? (
                <Text
                  style={{
                    fontSize: 12,
                    color: t.red,
                    marginTop: 6,
                    marginLeft: 2,
                    fontWeight: '600',
                  }}
                >
                  {errorMsg}
                </Text>
              ) : (
                <Text
                  style={{
                    fontSize: 12,
                    color: t.textMuted,
                    marginTop: 6,
                    marginLeft: 2,
                  }}
                >
                  Code communiqué par le parent
                </Text>
              )}
            </Animated.View>

            {/* Indicateur de progression PIN */}
            <Animated.View
              entering={FadeInDown.delay(160).duration(300)}
              style={{
                flexDirection: 'row',
                gap: 6,
                justifyContent: 'center',
                paddingVertical: 4,
              }}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <View
                  key={i}
                  style={{
                    width: i < pin.length ? 10 : 8,
                    height: i < pin.length ? 10 : 8,
                    borderRadius: 5,
                    backgroundColor:
                      i < pin.length
                        ? errorMsg
                          ? t.red
                          : t.accent
                        : t.isDark
                          ? 'rgba(255,255,255,0.12)'
                          : 'rgba(0,0,0,0.10)',
                  }}
                />
              ))}
            </Animated.View>

            {/* CTA */}
            <Animated.View
              entering={FadeInDown.delay(200).duration(320)}
              style={{ marginTop: 8 }}
            >
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isPending || !isReady}
                activeOpacity={0.85}
                style={{
                  backgroundColor: isReady
                    ? t.accent
                    : t.isDark
                      ? '#1e2530'
                      : '#f0f1f3',
                  borderRadius: 18,
                  height: 56,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 8,
                }}
              >
                {isPending ? (
                  <ActivityIndicator
                    color={isReady ? '#fff' : t.textMuted}
                    size="small"
                  />
                ) : (
                  <>
                    <Text
                      style={{
                        color: isReady ? '#fff' : t.textMuted,
                        fontWeight: '700',
                        fontSize: 16,
                        letterSpacing: 0.1,
                      }}
                    >
                      Continuer
                    </Text>
                    {isReady && (
                      <Ionicons name="arrow-forward" size={16} color="#fff" />
                    )}
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
});

function InputLabel({ label }: { label: string }) {
  const t = useTheme();
  return (
    <Text
      style={{
        fontSize: 12,
        fontWeight: '700',
        color: t.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.9,
        marginBottom: 8,
      }}
    >
      {label}
    </Text>
  );
}
