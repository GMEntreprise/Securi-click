import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle2, Lock, ShieldCheck } from 'lucide-react-native';
import React, { memo, useCallback } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRegisterCollector } from '../hooks/useRegister';
import {
  AuthBackButton,
  AuthPasswordField,
  AuthPrimaryButton,
} from '../components/ui';
import { useTheme } from '@/theme';

const activationSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, '8 caractères minimum')
    .regex(/[A-Z]/, '1 majuscule requise'),
  invitation_token: z.string().min(1),
});

type ActivationValues = z.infer<typeof activationSchema>;

function PasswordRule({ met, label }: { met: boolean; label: string }) {
  const t = useTheme();
  const color = met ? t.green : t.textMuted;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <CheckCircle2 size={14} color={color} strokeWidth={2.5} />
      <Text style={{ fontSize: 12, fontWeight: '600', color }}>{label}</Text>
    </View>
  );
}

export const CollectorAuthScreen: React.FC = memo(() => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const t = useTheme();
  const params = useLocalSearchParams<{
    token?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    child_name?: string;
  }>();

  const registerMutation = useRegisterCollector();

  const prefillEmail = params.email ?? '';
  const firstName = params.first_name ?? '';
  const lastName = params.last_name ?? '';
  const childName = params.child_name ?? '';
  const token = params.token ?? '';

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ActivationValues>({
    resolver: zodResolver(activationSchema),
    defaultValues: {
      email: prefillEmail,
      password: '',
      invitation_token: token,
    },
  });

  const passwordValue = watch('password') ?? '';
  const has8Chars = passwordValue.length >= 8;
  const hasUpper = /[A-Z]/.test(passwordValue);

  const handleSubmitForm = useCallback(
    (data: ActivationValues) => {
      registerMutation.mutate(
        {
          email: data.email,
          password: data.password,
          confirm_password: data.password,
          invitation_token: data.invitation_token,
          accept_terms: true,
          accept_privacy: true,
        },
        { onSuccess: () => router.replace('/(app)/dashboard' as any) }
      );
    },
    [registerMutation, router]
  );

  const fullName = firstName && lastName ? `${firstName} ${lastName}` : 'vous';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: t.bg }}
    >
      <AuthBackButton onPress={() => router.back()} light />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        <View style={{ paddingHorizontal: 24, paddingTop: insets.top + 60 }}>
          <Animated.View
            entering={FadeInDown.duration(400)}
            style={{ alignItems: 'center', marginBottom: 24 }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: t.isDark ? 'rgba(249,115,22,0.15)' : '#fff3e8',
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 20,
                marginBottom: 24,
              }}
            >
              <ShieldCheck size={13} color={t.accent} strokeWidth={2.5} />
              <Text
                style={{
                  color: t.accent,
                  fontSize: 11,
                  fontWeight: '800',
                  letterSpacing: 1.5,
                }}
              >
                ACCÈS TEMPORAIRE SÉCURISÉ
              </Text>
            </View>

            <View
              style={{
                width: '100%',
                borderRadius: 24,
                backgroundColor: t.card,
                borderWidth: 1,
                borderColor: t.cardBorder,
                height: 140,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: t.isDark ? 0.3 : 0.06,
                shadowRadius: 12,
                elevation: 4,
              }}
            >
              <ShieldCheck size={44} color={t.primary} strokeWidth={1.5} />
              <Text
                style={{
                  color: t.textSecondary,
                  fontSize: 13,
                  fontWeight: '600',
                  marginTop: 8,
                }}
              >
                Geste de confiance
              </Text>
            </View>

            <Text
              style={{
                fontSize: 24,
                fontWeight: '800',
                letterSpacing: -0.5,
                color: t.text,
                textAlign: 'center',
                marginBottom: 8,
              }}
            >
              Bonjour {fullName}
            </Text>
            {childName.length > 0 && (
              <Text
                style={{
                  color: t.textSecondary,
                  textAlign: 'center',
                  fontSize: 14,
                  lineHeight: 20,
                }}
              >
                Finalisez votre accès sécurisé à l'espace de{' '}
                <Text style={{ fontWeight: '700', color: t.text }}>
                  {childName}
                </Text>
                .
              </Text>
            )}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(120).duration(400)}>
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
                Votre email
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: t.iconBg,
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  borderWidth: 1.5,
                  borderColor: t.inputBorder,
                  minHeight: 56,
                }}
              >
                <Text
                  style={{
                    flex: 1,
                    color: t.textSecondary,
                    fontSize: 15,
                    paddingVertical: 16,
                  }}
                >
                  {prefillEmail || 'Non renseigné'}
                </Text>
                <Lock size={16} color={t.textMuted} />
              </View>
            </View>

            <AuthPasswordField
              control={control}
              name="password"
              label="Mot de passe unique"
              error={errors.password?.message}
            />

            {passwordValue.length > 0 && (
              <Animated.View
                entering={FadeInUp.duration(250)}
                style={{
                  flexDirection: 'row',
                  gap: 16,
                  marginTop: -8,
                  marginBottom: 16,
                }}
              >
                <PasswordRule met={has8Chars} label="8+ caractères" />
                <PasswordRule met={hasUpper} label="1 Majuscule" />
              </Animated.View>
            )}

            <View style={{ marginTop: 8 }}>
              <AuthPrimaryButton
                onPress={handleSubmit(handleSubmitForm)}
                isLoading={registerMutation.isPending}
                variant="accent"
                icon={<ShieldCheck size={18} color="#fff" strokeWidth={2} />}
              >
                Activer mon accès sécurisé
              </AuthPrimaryButton>
            </View>

            <View
              style={{
                marginTop: 20,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Lock size={11} color={t.textMuted} />
              <Text
                style={{
                  color: t.textMuted,
                  fontSize: 10,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                  fontWeight: '700',
                }}
              >
                Données chiffrées de bout en bout
              </Text>
            </View>
          </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
});

CollectorAuthScreen.displayName = 'CollectorAuthScreen';
