import React, { memo, useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Eye, EyeOff, Lock, Mail, ShieldAlert } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { useCollectorPinLogin, formatPinError } from '@/features/collector/hooks/useCollectorPinLogin';
import { useCollectorSessionStore } from '@/features/collector/stores/collectorSession.store';

const AUTO_HIDE_MS = 8_000;

export default memo(function CollectorPinScreen() {
  const t      = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const markVerified = useCollectorSessionStore(s => s.markVerified);

  const [email,   setEmail]   = useState('');
  const [pin,     setPin]     = useState('');
  const [visible, setVisible] = useState(false);
  const autoHideRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shakeX = useSharedValue(0);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const triggerShake = useCallback(() => {
    shakeX.value = withSequence(
      withTiming(-6, { duration: 60 }),
      withTiming(6,  { duration: 60 }),
      withTiming(-6, { duration: 60 }),
      withTiming(0,  { duration: 60 })
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, [shakeX]);

  const { mutate: pinLogin, isPending, error: loginError, reset: resetLogin } =
    useCollectorPinLogin(markVerified);

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

  const handleChangePin = useCallback((text: string) => {
    setPin(text.replace(/\D/g, '').slice(0, 6));
    if (loginError) resetLogin();
  }, [loginError, resetLogin]);

  const handleChangeEmail = useCallback((text: string) => {
    setEmail(text);
    if (loginError) resetLogin();
  }, [loginError, resetLogin]);

  const isReady = email.trim().length > 0 && pin.length === 6;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: t.bg }}
      keyboardVerticalOffset={0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: insets.top + 60,
            paddingBottom: insets.bottom + 48,
            flexGrow: 1,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.replace('/(auth)/index' as any)}
            hitSlop={12}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 24, alignSelf: 'flex-start' }}
          >
            <ArrowLeft size={18} color={t.textMuted} strokeWidth={2} />
            <Text style={{ fontSize: 14, color: t.textMuted, fontWeight: '600' }}>Choisir un rôle</Text>
          </TouchableOpacity>

          {/* Header */}
          <Animated.View entering={FadeInDown.duration(350)} style={{ marginBottom: 32 }}>
            <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: t.accentBg, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <Lock size={28} color={t.accent} strokeWidth={1.8} />
            </View>
            <Text style={{ fontSize: 28, fontWeight: '800', color: t.text, letterSpacing: -0.5, marginBottom: 8 }}>
              Espace collecteur
            </Text>
            <Text style={{ fontSize: 15, color: t.textSecondary, lineHeight: 22 }}>
              Entrez votre email et le code de connexion communiqué par le parent.
            </Text>
          </Animated.View>

          {/* Security notice */}
          <Animated.View
            entering={FadeInDown.delay(60).duration(300)}
            style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: t.amberBg, borderRadius: 12, padding: 12, marginBottom: 24 }}
          >
            <ShieldAlert size={14} color={t.amber} strokeWidth={2} style={{ marginTop: 1 }} />
            <Text style={{ flex: 1, fontSize: 12, color: t.textSecondary, lineHeight: 17 }}>
              Ce code à 6 chiffres vous a été communiqué par le parent qui vous a autorisé.
            </Text>
          </Animated.View>

          {/* Email input */}
          <Animated.View entering={FadeInDown.delay(100).duration(300)} style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: t.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
              Email
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: t.input, borderRadius: 14, borderWidth: 1.5, borderColor: t.inputBorder, paddingHorizontal: 14, minHeight: 56, gap: 10 }}>
              <Mail size={16} color={t.textMuted} strokeWidth={2} />
              <TextInput
                value={email}
                onChangeText={handleChangeEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                returnKeyType="next"
                placeholder="votre@email.com"
                placeholderTextColor={t.placeholder}
                editable={!isPending}
                style={{ flex: 1, fontSize: 15, color: t.text, paddingVertical: 14 }}
              />
            </View>
          </Animated.View>

          {/* PIN input */}
          <Animated.View entering={FadeInDown.delay(140).duration(300)} style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: t.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
              Code de connexion
            </Text>
            <Animated.View style={[shakeStyle, { flexDirection: 'row', alignItems: 'center', backgroundColor: t.input, borderRadius: 14, borderWidth: 1.5, borderColor: errorMsg ? t.red : t.inputBorder, paddingHorizontal: 14, minHeight: 56, gap: 10 }]}>
              <Lock size={16} color={t.textMuted} strokeWidth={2} />
              <TextInput
                value={pin}
                onChangeText={handleChangePin}
                keyboardType="number-pad"
                maxLength={6}
                secureTextEntry={!visible}
                contextMenuHidden
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                editable={!isPending}
                placeholder={visible ? '——————' : '••••••'}
                placeholderTextColor={t.placeholder}
                style={{ flex: 1, fontSize: visible ? 24 : 20, color: t.text, letterSpacing: visible ? 10 : 6, paddingVertical: 14 }}
              />
              <TouchableOpacity onPress={handleReveal} hitSlop={10} disabled={isPending}>
                {visible ? <EyeOff size={18} color={t.textMuted} /> : <Eye size={18} color={t.textMuted} />}
              </TouchableOpacity>
            </Animated.View>

            {visible && (
              <Text style={{ fontSize: 11, color: t.amber, textAlign: 'center', fontWeight: '600', marginTop: 6 }}>
                Code visible — masquage dans 8 secondes
              </Text>
            )}

            {errorMsg ? (
              <Text style={{ color: t.red, fontSize: 13, marginTop: 8, textAlign: 'center' }}>
                {errorMsg}
              </Text>
            ) : null}
          </Animated.View>

          {/* CTA */}
          <Animated.View entering={FadeInDown.delay(180).duration(300)} style={{ marginTop: 24 }}>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isPending || !isReady}
              style={{ backgroundColor: t.accent, borderRadius: 18, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, opacity: isPending || !isReady ? 0.55 : 1 }}
            >
              {isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Accéder à mon espace</Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* DEV ONLY */}
          {__DEV__ && (
            <Animated.View entering={FadeInDown.delay(240).duration(300)} style={{ marginTop: 24, alignItems: 'center' }}>
              <TouchableOpacity
                onPress={async () => {
                  await markVerified(0);
                  router.replace('/(collector-tabs)/home' as any);
                }}
                hitSlop={12}
                style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: t.amber }}
              >
                <Text style={{ fontSize: 12, color: t.amber, fontWeight: '600' }}>⚙️ Accès dev (bypass PIN)</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
});
