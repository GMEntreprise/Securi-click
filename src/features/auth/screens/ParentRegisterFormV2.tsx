import { Ionicons } from '@expo/vector-icons';
import React, { memo, useCallback } from 'react';
import { Text, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AuthCheckbox,
  AuthInputField,
  AuthPasswordField,
  AuthPrimaryButton,
  AuthStepBar,
  PasswordStrengthBar,
} from '../components/ui';
import type { RegisterParentData } from '../types';
import { useTheme } from '@/theme';
import { useTranslation } from 'react-i18next';

const step1Schema = z.object({
  first_name: z.string().min(2, 'Prénom requis'),
  last_name: z.string().min(2, 'Nom requis'),
  email: z.string().email('Email invalide'),
  phone: z.string().min(9, 'Téléphone invalide'),
  password: z
    .string()
    .min(8, '8 caractères minimum')
    .regex(/[A-Z]/, '1 majuscule requise'),
  accept_terms: z.boolean().refine(v => v, 'Veuillez accepter les CGU'),
  accept_privacy: z.boolean().refine(v => v, 'Veuillez accepter la politique'),
});

type Step1Values = z.infer<typeof step1Schema>;

function computeStrength(pwd: string): 'weak' | 'medium' | 'strong' {
  if (pwd.length < 6) return 'weak';
  const checks = [/[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r =>
    r.test(pwd)
  ).length;
  if (checks >= 3 && pwd.length >= 8) return 'strong';
  if (checks >= 2) return 'medium';
  return 'weak';
}

interface ParentRegisterFormV2Props {
  onSubmit: (data: RegisterParentData) => void;
  isLoading: boolean;
  error?: string | null;
  defaultEmail?: string;
  onOpenLegal?: () => void;
  onOpenPrivacy?: () => void;
}

export const ParentRegisterFormV2: React.FC<ParentRegisterFormV2Props> = memo(
  ({
    onSubmit,
    isLoading,
    error,
    defaultEmail = '',
    onOpenLegal,
    onOpenPrivacy,
  }) => {
    const t = useTheme();
    const { t: i18n } = useTranslation('auth');
    const {
      control,
      handleSubmit,
      watch,
      formState: { errors },
    } = useForm<Step1Values>({
      resolver: zodResolver(step1Schema),
      defaultValues: {
        first_name: '',
        last_name: '',
        email: defaultEmail,
        phone: '',
        password: '',
        accept_terms: false,
        accept_privacy: false,
      },
    });

    const passwordValue = watch('password');
    const strength = computeStrength(passwordValue ?? '');

    const submit = useCallback(
      (values: Step1Values) => {
        onSubmit({
          ...values,
          confirm_password: values.password,
        } as RegisterParentData);
      },
      [onSubmit]
    );

    return (
      <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
        <AuthStepBar currentStep={1} totalSteps={2} />

        <Text
          style={{
            fontSize: 26,
            fontWeight: '800',
            letterSpacing: -0.5,
            color: t.text,
            marginBottom: 6,
          }}
        >
          {i18n('parent_register_title_long')}
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: t.textSecondary,
            marginBottom: 24,
            lineHeight: 20,
          }}
        >
          {i18n('parent_register_desc')}
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

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <AuthInputField
              control={control}
              name="first_name"
              label={i18n('first_name')}
              placeholder="Jean"
              error={errors.first_name?.message}
              autoComplete="given-name"
            />
          </View>
          <View style={{ flex: 1 }}>
            <AuthInputField
              control={control}
              name="last_name"
              label={i18n('last_name')}
              placeholder="Dupont"
              error={errors.last_name?.message}
              autoComplete="family-name"
            />
          </View>
        </View>

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

        <AuthInputField
          control={control}
          name="phone"
          label={i18n('phone')}
          placeholder={i18n('phone_placeholder')}
          icon={<Ionicons name="call-outline" size={18} color={t.textMuted} />}
          error={errors.phone?.message}
          keyboardType="phone-pad"
        />

        <AuthPasswordField
          control={control}
          name="password"
          label={i18n('password')}
          error={errors.password?.message}
        />

        {passwordValue?.length > 0 && (
          <View style={{ marginTop: -8, marginBottom: 16 }}>
            <PasswordStrengthBar strength={strength} />
          </View>
        )}

        <AuthCheckbox
          control={control}
          name="accept_terms"
          error={errors.accept_terms?.message}
          label={
            <Text
              style={{ fontSize: 13, color: t.textSecondary, lineHeight: 18 }}
            >
              {i18n('terms_accept_pre')}{' '}
              <Text
                style={{ color: t.accent, fontWeight: '700' }}
                onPress={onOpenLegal}
              >
                {i18n('terms_accept_link')}
              </Text>
              {i18n('terms_accept_post')}
            </Text>
          }
        />

        <AuthCheckbox
          control={control}
          name="accept_privacy"
          error={errors.accept_privacy?.message}
          label={
            <Text
              style={{ fontSize: 13, color: t.textSecondary, lineHeight: 18 }}
            >
              {i18n('privacy_accept_pre')}{' '}
              <Text
                style={{ color: t.accent, fontWeight: '700' }}
                onPress={onOpenPrivacy}
              >
                {i18n('privacy_accept_link')}
              </Text>
              {i18n('privacy_accept_post')}
            </Text>
          }
        />

        <View style={{ marginTop: 16 }}>
          <AuthPrimaryButton
            onPress={handleSubmit(submit)}
            isLoading={isLoading}
            variant="accent"
            icon={<Ionicons name="chevron-forward" size={18} color="#fff" />}
          >
            {i18n('next')}
          </AuthPrimaryButton>
        </View>

        <View
          style={{
            marginTop: 20,
            borderRadius: 16,
            padding: 16,
            backgroundColor: t.isDark ? t.card : '#fef9f5',
            borderWidth: 1,
            borderColor: t.isDark ? t.cardBorder : '#fde8d4',
          }}
        >
          <Text
            style={{
              textAlign: 'center',
              color: t.textSecondary,
              fontSize: 12,
              fontStyle: 'italic',
              lineHeight: 18,
            }}
          >
            {i18n('parent_register_social_proof')}
          </Text>
        </View>
      </View>
    );
  }
);

ParentRegisterFormV2.displayName = 'ParentRegisterFormV2';
