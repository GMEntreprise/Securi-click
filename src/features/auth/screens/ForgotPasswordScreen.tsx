import { Ionicons } from '@expo/vector-icons';
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
import { useTranslation } from 'react-i18next';

export const ForgotPasswordScreen: React.FC = memo(() => {
  const t = useTheme();
  const { t: i18n } = useTranslation('auth');
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
          <Ionicons name="arrow-back" size={24} color={t.text} />
        </Pressable>

        {emailSent ? (
          <Animated.View
            entering={FadeInDown.duration(400)}
            style={{ flex: 1 }}
          >
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
                <Ionicons name="checkmark-circle" size={40} color={t.green} />
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
                {i18n('forgot_password_check_email')}
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
                {i18n('forgot_password_sent_body')}
                {'\n'}
                <Text style={{ fontWeight: '700', color: t.text }}>
                  {getValues('email')}
                </Text>
                {'\n\n'}
                {i18n('forgot_password_sent_body2')}
              </Text>

              <Pressable
                onPress={() => nav.goToLogin()}
                style={{ marginTop: 8 }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '700',
                    color: t.accent,
                    textDecorationLine: 'underline',
                  }}
                >
                  {i18n('forgot_password_back')}
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
              {i18n('forgot_password_title')}
            </Text>

            <Text
              style={{
                fontSize: 14,
                color: t.textSecondary,
                lineHeight: 22,
                marginBottom: 32,
              }}
            >
              {i18n('forgot_password_desc_long')}
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
                    ? i18n('forgot_password_error_rate')
                    : i18n('forgot_password_error_generic')}
                </Text>
              </View>
            )}

            <AuthInputField
              control={control}
              name="email"
              label={i18n('email')}
              placeholder={i18n('email_placeholder')}
              icon={
                <Ionicons name="mail-outline" size={18} color={t.textMuted} />
              }
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
                icon={<Ionicons name="send-outline" size={18} color="#fff" />}
              >
                {i18n('forgot_password_send')}
              </AuthPrimaryButton>
            </View>
          </Animated.View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
});

ForgotPasswordScreen.displayName = 'ForgotPasswordScreen';
