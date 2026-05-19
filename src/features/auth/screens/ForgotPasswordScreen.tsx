import { ArrowLeft, CheckCircle, Mail, Send } from 'lucide-react-native';
import React, { memo, useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from '../schemas/auth.schema';
import { AuthInputField, AuthPrimaryButton } from '../components/ui';
import { useForgotPassword } from '../hooks/useForgotPassword';
import { useAppNavigation } from '@/navigation/useAppNavigation';
import { useTheme } from '@/theme';

export const ForgotPasswordScreen: React.FC = memo(() => {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const nav = useAppNavigation();
  const [emailSent, setEmailSent] = useState(false);

  const mutation = useForgotPassword();

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = useCallback(
    (data: ForgotPasswordFormData) => {
      mutation.mutate(data.email, {
        onSuccess: () => setEmailSent(true),
      });
    },
    [mutation]
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: t.bg }}
    >
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 32,
          flex: 1,
        }}
      >
        <Pressable
          onPress={() => nav.goToLogin()}
          hitSlop={12}
          style={{ marginBottom: 32, alignSelf: 'flex-start' }}
        >
          <ArrowLeft size={24} color={t.text} />
        </Pressable>

        {emailSent ? (
          <Animated.View entering={FadeInDown.duration(400)} style={{ flex: 1 }}>
            <View
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 20,
              }}
            >
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: t.greenBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle size={40} color={t.green} strokeWidth={1.5} />
              </View>

              <Text
                style={{
                  fontSize: 24,
                  fontWeight: '800',
                  color: t.text,
                  textAlign: 'center',
                  letterSpacing: -0.5,
                }}
              >
                Vérifiez votre email
              </Text>

              <Text
                style={{
                  fontSize: 14,
                  color: t.textSecondary,
                  textAlign: 'center',
                  lineHeight: 22,
                  paddingHorizontal: 8,
                }}
              >
                Un lien de réinitialisation a été envoyé à{'\n'}
                <Text style={{ fontWeight: '700', color: t.text }}>
                  {getValues('email')}
                </Text>
                {'\n\n'}
                Cliquez sur le lien dans l'email pour créer votre nouveau mot de passe.
              </Text>

              <Pressable onPress={() => nav.goToLogin()} style={{ marginTop: 8 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '700',
                    color: t.accent,
                    textDecorationLine: 'underline',
                  }}
                >
                  Retour à la connexion
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.duration(400)}>
            <Text
              style={{
                fontSize: 28,
                fontWeight: '800',
                color: t.text,
                letterSpacing: -0.5,
                marginBottom: 8,
              }}
            >
              Mot de passe oublié ?
            </Text>

            <Text
              style={{
                fontSize: 14,
                color: t.textSecondary,
                lineHeight: 22,
                marginBottom: 32,
              }}
            >
              Saisissez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </Text>

            {mutation.error && (
              <View
                style={{
                  marginBottom: 16,
                  backgroundColor: t.redBg,
                  borderWidth: 1,
                  borderColor: t.red,
                  borderRadius: 16,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                }}
              >
                <Text style={{ color: t.red, fontSize: 13, fontWeight: '600' }}>
                  {mutation.error.message.includes('rate limit')
                    ? 'Trop de tentatives. Attendez quelques minutes.'
                    : 'Une erreur est survenue. Vérifiez votre email et réessayez.'}
                </Text>
              </View>
            )}

            <AuthInputField
              control={control}
              name="email"
              label="Email"
              placeholder="jean.dupont@exemple.fr"
              icon={<Mail size={18} color={t.textMuted} />}
              error={errors.email?.message}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <View style={{ marginTop: 8 }}>
              <AuthPrimaryButton
                onPress={handleSubmit(onSubmit)}
                isLoading={mutation.isPending}
                variant="accent"
                icon={<Send size={18} color="#fff" strokeWidth={2} />}
              >
                Envoyer le lien
              </AuthPrimaryButton>
            </View>
          </Animated.View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
});

ForgotPasswordScreen.displayName = 'ForgotPasswordScreen';
