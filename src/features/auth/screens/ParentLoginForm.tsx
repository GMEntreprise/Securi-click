import { Ionicons } from '@expo/vector-icons';
import React, { memo, useCallback } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  loginSchema,
  type LoginFormData as LoginValues,
} from '../schemas/auth.schema';
import {
  AuthInputField,
  AuthPasswordField,
  AuthPrimaryButton,
} from '../components/ui';
import { useTheme } from '@/theme';
import { useTranslation } from 'react-i18next';

interface ParentLoginFormProps {
  onSubmit: (data: LoginValues) => void;
  isLoading: boolean;
  error?: string | null;
  onForgotPassword?: () => void;
  defaultEmail?: string;
}

export const ParentLoginForm: React.FC<ParentLoginFormProps> = memo(
  ({ onSubmit, isLoading, error, onForgotPassword, defaultEmail = '' }) => {
    const t = useTheme();
    const { t: i18n } = useTranslation('auth');
    const {
      control,
      handleSubmit,
      formState: { errors },
    } = useForm<LoginValues>({
      resolver: zodResolver(loginSchema),
      defaultValues: { email: defaultEmail, password: '' },
    });

    const submit = useCallback(
      (values: LoginValues) => onSubmit(values),
      [onSubmit]
    );

    return (
      <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
        <Text
          style={{
            fontSize: 26,
            fontWeight: '800',
            letterSpacing: -0.5,
            color: t.text,
            marginBottom: 6,
          }}
        >
          {i18n('parent_login_welcome')}
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: t.textSecondary,
            marginBottom: 24,
            lineHeight: 20,
          }}
        >
          {i18n('parent_login_desc')}
        </Text>

        {error && (
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
              {error}
            </Text>
          </View>
        )}

        <AuthInputField
          control={control}
          name="email"
          label={i18n('email')}
          placeholder={i18n('email_placeholder')}
          icon={<Ionicons name="mail-outline" size={18} color={t.textMuted} />}
          error={errors.email?.message}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />

        <AuthPasswordField
          control={control}
          name="password"
          label={i18n('password')}
          error={errors.password?.message}
          rightLabel={
            <Pressable onPress={onForgotPassword} hitSlop={8}>
              <Text
                style={{ fontSize: 12, fontWeight: '700', color: t.accent }}
              >
                {i18n('forgot_q')}
              </Text>
            </Pressable>
          }
        />

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginBottom: 24,
          }}
        >
          <Ionicons name="checkmark-circle" size={16} color={t.green} />
          <Text style={{ fontSize: 13, color: t.green, fontWeight: '600' }}>
            {i18n('parent_login_pitch')}
          </Text>
        </View>

        <AuthPrimaryButton
          onPress={handleSubmit(submit)}
          isLoading={isLoading}
          variant="accent"
          icon={<Ionicons name="arrow-forward" size={18} color="#fff" />}
        >
          {i18n('login')}
        </AuthPrimaryButton>
      </View>
    );
  }
);

ParentLoginForm.displayName = 'ParentLoginForm';
