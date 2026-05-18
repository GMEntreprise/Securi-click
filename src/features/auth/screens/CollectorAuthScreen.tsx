import { Toast } from '@/shared/ui/molecules/Toast';
import { useTheme } from '@/theme';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Mail, MailCheck, Send } from 'lucide-react-native';
import React, { memo, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AuthBackButton,
  AuthInputField,
  AuthPrimaryButton,
} from '../components/ui';
import { useLastEmail } from '../hooks/useLastEmail';
import { useInviteCollector } from '../hooks/useRegister';
import type { CollectorOtpFormData } from '../schemas/auth.schema';
import { collectorOtpSchema } from '../schemas/auth.schema';

function formatAuthError(msg: string): string {
  const lower = msg.toLowerCase();
  if (
    lower.includes('rate limit') ||
    lower.includes('too many') ||
    lower.includes('429')
  ) {
    return 'Trop de tentatives. Attendez quelques minutes avant de réessayer.';
  }
  if (lower.includes('invalid email') || lower.includes('email not found')) {
    return 'Adresse email invalide.';
  }
  if (lower.includes('email link') || lower.includes('otp expired')) {
    return 'Lien expiré. Demandez un nouveau lien.';
  }
  return 'Une erreur est survenue. Réessayez.';
}

export const CollectorAuthScreen: React.FC = memo(() => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const t = useTheme();
  const [sent, setSent] = useState(false);

  const lastEmail = useLastEmail();
  const inviteMutation = useInviteCollector();

  const {
    control,
    handleSubmit,
    getValues,
    reset,
    formState: { errors },
  } = useForm<CollectorOtpFormData>({
    resolver: zodResolver(collectorOtpSchema),
    defaultValues: { email: '' },
  });

  React.useEffect(() => {
    if (lastEmail) reset({ email: lastEmail });
  }, [lastEmail, reset]);

  const onSubmit = (data: CollectorOtpFormData) => {
    inviteMutation.mutate(
      { email: data.email },
      {
        onSuccess: () => {
          setSent(true);
          Toast.show('Lien envoyé ! Vérifiez votre boîte mail.', {
            type: 'success',
            duration: 3000,
          });
        },
        onError: e => {
          const msg = formatAuthError((e as Error).message ?? '');
          Toast.show(msg, { type: 'error', duration: 5000 });
        },
      }
    );
  };

  const handleResend = () => {
    const email = getValues('email');
    inviteMutation.mutate(
      { email },
      {
        onSuccess: () => {
          Toast.show('Nouveau lien envoyé !', {
            type: 'success',
            duration: 3000,
          });
        },
        onError: e => {
          const msg = formatAuthError((e as Error).message ?? '');
          Toast.show(msg, { type: 'error', duration: 5000 });
        },
      }
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: t.bg }}
    >
      <AuthBackButton onPress={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        <View style={{ paddingHorizontal: 24, paddingTop: insets.top + 60 }}>
          {sent ? (
            <Animated.View
              entering={FadeInDown.duration(400)}
              style={{ alignItems: 'center', paddingTop: 40 }}
            >
              <MailCheck size={48} color={t.green} strokeWidth={1.5} />
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: '800',
                  color: t.text,
                  textAlign: 'center',
                  marginTop: 20,
                  marginBottom: 12,
                  letterSpacing: -0.5,
                }}
              >
                Lien envoyé !
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  color: t.textSecondary,
                  textAlign: 'center',
                  lineHeight: 22,
                  marginBottom: 32,
                }}
              >
                Vérifiez votre boîte mail et cliquez sur le lien pour accéder à
                votre espace.
              </Text>
              <AuthPrimaryButton
                onPress={handleResend}
                isLoading={inviteMutation.isPending}
                variant="primary"
              >
                Renvoyer l'email
              </AuthPrimaryButton>
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
                Lien non reçu ?
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  color: t.textSecondary,
                  lineHeight: 22,
                  marginBottom: 32,
                }}
              >
                Si vous n'avez pas reçu le lien d'invitation du parent, entrez
                votre email pour en recevoir un nouveau.
              </Text>

              <AuthInputField
                control={control}
                name="email"
                label="Email"
                icon={<Mail size={16} color={t.textMuted} />}
                placeholder="votre@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                error={errors.email?.message}
              />

              <View style={{ marginTop: 8 }}>
                <AuthPrimaryButton
                  onPress={handleSubmit(onSubmit)}
                  isLoading={inviteMutation.isPending}
                  variant="accent"
                  icon={<Send size={16} color="#fff" strokeWidth={2} />}
                >
                  Recevoir mon lien d'accès
                </AuthPrimaryButton>
              </View>
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
});

CollectorAuthScreen.displayName = 'CollectorAuthScreen';
