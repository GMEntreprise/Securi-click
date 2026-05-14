import React, { memo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, MailCheck } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useInviteCollector } from '../hooks/useRegister';
import { collectorOtpSchema } from '../schemas/auth.schema';
import type { CollectorOtpFormData } from '../schemas/auth.schema';
import { AuthBackButton, AuthInputField, AuthPrimaryButton } from '../components/ui';
import { useTheme } from '@/theme';

export const CollectorAuthScreen: React.FC = memo(() => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const t = useTheme();
  const [sent, setSent] = useState(false);

  const inviteMutation = useInviteCollector();

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<CollectorOtpFormData>({
    resolver: zodResolver(collectorOtpSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = (data: CollectorOtpFormData) => {
    inviteMutation.mutate(
      { email: data.email },
      { onSuccess: () => setSent(true) }
    );
  };

  const handleResend = () => {
    const email = getValues('email');
    inviteMutation.mutate({ email });
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
                Vérifiez votre boîte mail et cliquez sur le lien pour accéder à votre espace.
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
                Accéder à mon espace
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  color: t.textSecondary,
                  lineHeight: 22,
                  marginBottom: 32,
                }}
              >
                Votre parent vous a invité. Entrez votre email pour recevoir votre lien d'accès sécurisé.
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

              {inviteMutation.isError && (
                <Text
                  style={{
                    color: t.red,
                    fontSize: 13,
                    marginBottom: 12,
                    textAlign: 'center',
                  }}
                >
                  {(inviteMutation.error as Error)?.message ?? 'Une erreur est survenue.'}
                </Text>
              )}

              <View style={{ marginTop: 8 }}>
                <AuthPrimaryButton
                  onPress={handleSubmit(onSubmit)}
                  isLoading={inviteMutation.isPending}
                  variant="accent"
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
