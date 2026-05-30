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
  resetPasswordSchema,
  type ResetPasswordFormData,
} from '../schemas/auth.schema';
import { AuthPasswordField, AuthPrimaryButton } from '../components/ui';
import { useResetPassword } from '../hooks/useResetPassword';
import { useAuthStore } from '../store/auth.store';
import { useAppNavigation } from '@/navigation/useAppNavigation';
import { useTheme } from '@/theme';
import { useTranslation } from 'react-i18next';

export const ResetPasswordScreen: React.FC = memo(() => {
  const t = useTheme();
  const { t: i18n } = useTranslation('auth');
  const insets = useSafeAreaInsets();
  const nav = useAppNavigation();
  const [success, setSuccess] = useState(false);

  const mutation = useResetPassword();
  const role = useAuthStore(s => s.session?.user.role);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirm_password: '' },
  });

  const onSubmit = useCallback(
    (data: ResetPasswordFormData) => {
      mutation.mutate(data.password, {
        onSuccess: () => setSuccess(true),
      });
    },
    [mutation]
  );

  const goToDashboard = useCallback(() => {
    if (role === 'school_admin' || role === 'staff') {
      nav.goToSchoolDashboard();
    } else {
      nav.goToParentDashboard();
    }
  }, [nav, role]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: t.bg }}
    >
      <View
        style={{
          paddingTop: insets.top + 24,
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 32,
          flex: 1,
        }}
      >
        {success ? (
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
                {i18n('reset_password_updated_title')}
              </Text>

              <Text
                style={{
                  fontSize: 14,
                  color: t.textSecondary,
                  textAlign: 'center',
                  lineHeight: 22,
                }}
              >
                {i18n('reset_password_updated_body')}
              </Text>

              <View style={{ marginTop: 8, width: '100%' }}>
                <AuthPrimaryButton onPress={goToDashboard} variant="accent">
                  {i18n('reset_password_go_dashboard')}
                </AuthPrimaryButton>
              </View>
            </View>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.duration(400)}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: t.primaryBg,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}
            >
              <Ionicons name="shield-checkmark" size={28} color={t.primary} />
            </View>

            <Text
              style={{
                fontSize: 28,
                fontWeight: '800',
                color: t.text,
                letterSpacing: -0.5,
                marginBottom: 8,
              }}
            >
              {i18n('reset_password_title')}
            </Text>

            <Text
              style={{
                fontSize: 14,
                color: t.textSecondary,
                lineHeight: 22,
                marginBottom: 32,
              }}
            >
              {i18n('reset_password_desc_long')}
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
                  {mutation.error.message.includes('expired') ||
                  mutation.error.message.includes('invalid')
                    ? i18n('reset_error_expired')
                    : mutation.error.message.includes('same')
                      ? i18n('reset_error_same')
                      : i18n('reset_error_generic')}
                </Text>
              </View>
            )}

            <AuthPasswordField
              control={control}
              name="password"
              label={i18n('reset_password_new_label')}
              placeholder={i18n('reset_password_placeholder')}
              error={errors.password?.message}
            />

            <AuthPasswordField
              control={control}
              name="confirm_password"
              label={i18n('password_confirm')}
              error={errors.confirm_password?.message}
            />

            <View style={{ marginTop: 8 }}>
              <AuthPrimaryButton
                onPress={handleSubmit(onSubmit)}
                isLoading={mutation.isPending}
                variant="accent"
              >
                {i18n('reset_password_save')}
              </AuthPrimaryButton>
            </View>

            <Pressable
              onPress={() => nav.goToLogin()}
              style={{ marginTop: 20, alignItems: 'center' }}
              hitSlop={8}
            >
              <Text style={{ fontSize: 13, color: t.textSecondary }}>
                {i18n('reset_password_link_expired_q')}{' '}
                <Text style={{ color: t.accent, fontWeight: '700' }}>
                  {i18n('reset_password_request_new')}
                </Text>
              </Text>
            </Pressable>
          </Animated.View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
});

ResetPasswordScreen.displayName = 'ResetPasswordScreen';
