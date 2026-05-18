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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Eye, EyeOff, Lock, ShieldAlert } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { supabase } from '@/lib/supabase/client';
import { useCollectorPinLogin, formatPinError } from '@/features/collector/hooks/useCollectorPinLogin';
import { useCollectorSessionStore } from '@/features/collector/stores/collectorSession.store';
import { useSession } from '@/features/auth/store/auth.store';
import { Toast } from '@/shared/ui/molecules/Toast';

const AUTO_HIDE_MS = 8_000;

interface InviteContext {
  guardian_id: string;
  first_name: string;
  last_name: string;
  relationship: string;
  has_pin: boolean;
  child_first_name: string;
  child_last_name: string;
}

// ─── First-time flow: accept invite + verify PIN in one step ──────────────────
async function acceptAndVerify(
  invitationToken: string,
  pin: string
): Promise<{ access_code_version: number }> {
  const { data, error } = await supabase.rpc('accept_guardian_invite', {
    p_invitation_token: invitationToken,
    p_access_code: pin,
  });
  if (error) throw new Error(error.message);
  const result = data as { error?: string; guardian_id?: string; parent_id?: string };
  if (result.error) throw new Error(result.error);

  // Fetch the real access_code_version from DB after acceptance
  const { data: guardian } = await supabase
    .from('guardians')
    .select('access_code_version')
    .eq('invitation_token', null as any)
    .eq('collector_user_id', (await supabase.auth.getUser()).data.user?.id ?? '')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return { access_code_version: guardian?.access_code_version ?? 1 };
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default memo(function CollectorPinScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const session = useSession();
  const { invitation_token: invitationToken } = useLocalSearchParams<{
    invitation_token?: string;
  }>();
  const markVerified = useCollectorSessionStore(s => s.markVerified);

  const isFirstTime = !!invitationToken;

  // Invite context shown on the PIN screen when coming from a link
  const [inviteContext, setInviteContext] = useState<InviteContext | null>(null);
  const [contextLoading, setContextLoading] = useState(isFirstTime);

  const [pin, setPin] = useState('');
  const [visible, setVisible] = useState(false);
  const [firstTimeError, setFirstTimeError] = useState<string | null>(null);
  const [firstTimePending, setFirstTimePending] = useState(false);
  const autoHideRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shakeX = useSharedValue(0);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  // Load invite context (child name etc.) from the token — unauthenticated safe
  useEffect(() => {
    if (!invitationToken) return;
    Promise.resolve(
      supabase.rpc('get_invite_context', { p_invitation_token: invitationToken })
    )
      .then(({ data }) => {
        if (data && !(data as { error?: string }).error) {
          setInviteContext(data as InviteContext);
        }
      })
      .catch(() => {})
      .finally(() => setContextLoading(false));
  }, [invitationToken]);

  useEffect(() => {
    return () => {
      if (autoHideRef.current) clearTimeout(autoHideRef.current);
    };
  }, []);

  // Recurring login hook (used when isFirstTime = false)
  const { mutate: pinLogin, isPending: pinLoginPending, error: pinLoginError, reset: resetPinLogin } =
    useCollectorPinLogin(markVerified);

  const errorMsg = isFirstTime
    ? firstTimeError
    : pinLoginError
    ? formatPinError(pinLoginError.message)
    : null;

  const isPending = isFirstTime ? firstTimePending : pinLoginPending;

  const triggerShake = useCallback(() => {
    shakeX.value = withSequence(
      withTiming(-6, { duration: 60 }),
      withTiming(6, { duration: 60 }),
      withTiming(-6, { duration: 60 }),
      withTiming(0, { duration: 60 })
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, [shakeX]);

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
    if (pin.length !== 6) {
      triggerShake();
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isFirstTime && invitationToken) {
      setFirstTimePending(true);
      setFirstTimeError(null);
      acceptAndVerify(invitationToken, pin)
        .then(async ({ access_code_version }) => {
          await markVerified(access_code_version);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Toast.show('Accès activé ! Bienvenue.', { type: 'success', duration: 3000 });
          router.replace('/(collector-tabs)' as any);
        })
        .catch(e => {
          const code = (e as Error).message;
          const msg =
            code === 'invalid_access_code' ? 'Code incorrect. Vérifiez auprès du parent.' :
            code === 'pin_locked'           ? 'Trop de tentatives. Réessayez dans 15 minutes.' :
            code === 'invalid_token'        ? 'Lien expiré ou déjà utilisé.' :
            code === 'access_code_required' ? 'Un code PIN est requis.' :
            'Une erreur est survenue. Réessayez.';
          setFirstTimeError(msg);
          triggerShake();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        })
        .finally(() => setFirstTimePending(false));
    } else {
      pinLogin(pin);
    }
  }, [pin, isFirstTime, invitationToken, markVerified, pinLogin, router, triggerShake]);

  const handleChangePin = useCallback(
    (text: string) => {
      setPin(text.replace(/\D/g, '').slice(0, 6));
      if (firstTimeError) setFirstTimeError(null);
      if (pinLoginError) resetPinLogin();
    },
    [firstTimeError, pinLoginError, resetPinLogin]
  );

  const handleUseEmail = useCallback(() => {
    router.replace('/(auth)/collector' as any);
  }, [router]);

  // Greeting: use invite context if first-time, else session profile
  const firstName = isFirstTime
    ? inviteContext?.first_name
    : session?.user.profile?.first_name;
  const childName = isFirstTime && inviteContext
    ? `${inviteContext.child_first_name} ${inviteContext.child_last_name}`.trim()
    : null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: t.bg }}
    >
      <View
        style={{
          flex: 1,
          paddingHorizontal: 24,
          paddingTop: insets.top + 60,
          paddingBottom: insets.bottom + 32,
        }}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(350)} style={{ marginBottom: 32 }}>
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
            <Lock size={28} color={t.accent} strokeWidth={1.8} />
          </View>

          {contextLoading ? (
            <ActivityIndicator color={t.accent} />
          ) : (
            <>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: '800',
                  color: t.text,
                  letterSpacing: -0.5,
                  marginBottom: 8,
                }}
              >
                {isFirstTime
                  ? firstName
                    ? `Bonjour, ${firstName} !`
                    : 'Activer votre accès'
                  : firstName
                  ? `Bonjour, ${firstName}`
                  : 'Déverrouiller'}
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  color: t.textSecondary,
                  lineHeight: 22,
                }}
              >
                {isFirstTime
                  ? childName
                    ? `Entrez le code PIN pour confirmer votre autorisation à récupérer ${childName}.`
                    : 'Entrez le code PIN que le parent vous a communiqué.'
                  : 'Entrez votre code de sécurité à 6 chiffres pour accéder à votre espace.'}
              </Text>
            </>
          )}
        </Animated.View>

        {/* Security notice */}
        <Animated.View
          entering={FadeInDown.delay(60).duration(300)}
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 8,
            backgroundColor: t.amberBg,
            borderRadius: 12,
            padding: 12,
            marginBottom: 20,
          }}
        >
          <ShieldAlert size={14} color={t.amber} strokeWidth={2} style={{ marginTop: 1 }} />
          <Text style={{ flex: 1, fontSize: 12, color: t.textSecondary, lineHeight: 17 }}>
            {isFirstTime
              ? 'Ce code à 6 chiffres vous a été communiqué par le parent qui vous a invité.'
              : 'Ce code vous a été communiqué par le parent qui vous a invité.'}
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
                backgroundColor: t.input,
                borderRadius: 14,
                borderWidth: 1.5,
                borderColor: errorMsg ? t.red : t.inputBorder,
                paddingHorizontal: 14,
                minHeight: 56,
                gap: 10,
              },
            ]}
          >
            <Lock size={16} color={t.textMuted} strokeWidth={2} />
            <TextInput
              value={pin}
              onChangeText={handleChangePin}
              keyboardType="number-pad"
              maxLength={6}
              secureTextEntry={!visible}
              contextMenuHidden
              autoFocus
              editable={!isPending}
              style={{
                flex: 1,
                fontSize: visible ? 24 : 20,
                color: t.text,
                letterSpacing: visible ? 10 : 6,
                paddingVertical: 14,
              }}
              placeholder={visible ? '——————' : '••••••'}
              placeholderTextColor={t.placeholder}
            />
            <TouchableOpacity onPress={handleReveal} hitSlop={10} disabled={isPending}>
              {visible ? (
                <EyeOff size={18} color={t.textMuted} />
              ) : (
                <Eye size={18} color={t.textMuted} />
              )}
            </TouchableOpacity>
          </Animated.View>

          {visible && (
            <Text
              style={{
                fontSize: 11,
                color: t.amber,
                textAlign: 'center',
                fontWeight: '600',
                marginTop: 6,
              }}
            >
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
        <Animated.View
          entering={FadeInDown.delay(180).duration(300)}
          style={{ marginTop: 16 }}
        >
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isPending || pin.length !== 6}
            style={{
              backgroundColor: t.accent,
              borderRadius: 18,
              paddingVertical: 16,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
              opacity: isPending || pin.length !== 6 ? 0.55 : 1,
            }}
          >
            {isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
                {isFirstTime ? 'Activer mon accès' : 'Accéder à mon espace'}
              </Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Fallback — uniquement si pas de token (connexion récurrente) */}
        {!isFirstTime && (
          <Animated.View
            entering={FadeInDown.delay(240).duration(300)}
            style={{ marginTop: 20, alignItems: 'center', gap: 12 }}
          >
            <TouchableOpacity onPress={handleUseEmail} hitSlop={12} disabled={isPending}>
              <Text
                style={{
                  fontSize: 13,
                  color: t.textMuted,
                  textDecorationLine: 'underline',
                }}
              >
                Code perdu ? Contactez le parent
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.replace('/(auth)/collector' as any)}
              hitSlop={12}
              disabled={isPending}
            >
              <Text
                style={{
                  fontSize: 13,
                  color: t.textMuted,
                  textDecorationLine: 'underline',
                }}
              >
                Pas encore reçu d'invitation ?
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* DEV ONLY — bypass PIN for local testing */}
        {__DEV__ && (
          <Animated.View
            entering={FadeInDown.delay(300).duration(300)}
            style={{ marginTop: 24, alignItems: 'center' }}
          >
            <TouchableOpacity
              onPress={async () => {
                await markVerified(0);
                router.replace('/(collector-tabs)' as any);
              }}
              hitSlop={12}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: t.amber,
              }}
            >
              <Text style={{ fontSize: 12, color: t.amber, fontWeight: '600' }}>
                ⚙️ Accès dev (bypass PIN)
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
});
