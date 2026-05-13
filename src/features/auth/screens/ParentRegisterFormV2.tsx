import { ChevronRight, Mail, Phone } from 'lucide-react-native';
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
}

export const ParentRegisterFormV2: React.FC<ParentRegisterFormV2Props> = memo(
  ({ onSubmit, isLoading, error }) => {
    const t = useTheme();
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
        email: '',
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
        <AuthStepBar currentStep={1} totalSteps={2} accentColor={t.accent} />

        <Text
          style={{
            fontSize: 26,
            fontWeight: '800',
            letterSpacing: -0.5,
            color: t.text,
            marginBottom: 6,
          }}
        >
          Créer votre compte{'\n'}Parent
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: t.textSecondary,
            marginBottom: 24,
            lineHeight: 20,
          }}
        >
          Sécurisez l'espace numérique de votre famille en quelques instants.
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
              label="Prénom"
              placeholder="Jean"
              error={errors.first_name?.message}
              autoComplete="given-name"
            />
          </View>
          <View style={{ flex: 1 }}>
            <AuthInputField
              control={control}
              name="last_name"
              label="Nom"
              placeholder="Dupont"
              error={errors.last_name?.message}
              autoComplete="family-name"
            />
          </View>
        </View>

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

        <AuthInputField
          control={control}
          name="phone"
          label="Téléphone mobile"
          placeholder="06 12 34 56 78"
          icon={<Phone size={18} color={t.textMuted} />}
          error={errors.phone?.message}
          keyboardType="phone-pad"
        />

        <AuthPasswordField
          control={control}
          name="password"
          label="Mot de passe"
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
          accentColor={t.accent}
          error={errors.accept_terms?.message}
          label={
            <Text
              style={{ fontSize: 13, color: t.textSecondary, lineHeight: 18 }}
            >
              J'accepte les{' '}
              <Text style={{ color: t.accent, fontWeight: '700' }}>
                Conditions Générales d'Utilisation
              </Text>{' '}
              de Securi'Click.
            </Text>
          }
        />

        <AuthCheckbox
          control={control}
          name="accept_privacy"
          accentColor={t.accent}
          error={errors.accept_privacy?.message}
          label={
            <Text
              style={{ fontSize: 13, color: t.textSecondary, lineHeight: 18 }}
            >
              Je reconnais avoir pris connaissance de la{' '}
              <Text style={{ color: t.accent, fontWeight: '700' }}>
                Politique de Confidentialité
              </Text>
              .
            </Text>
          }
        />

        <View style={{ marginTop: 16 }}>
          <AuthPrimaryButton
            onPress={handleSubmit(submit)}
            isLoading={isLoading}
            variant="accent"
            icon={<ChevronRight size={18} color="#fff" strokeWidth={2.5} />}
          >
            Suivant
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
            "Rejoignez plus de 10 000 parents qui font confiance à Securi'Click
            pour protéger leurs enfants."
          </Text>
        </View>
      </View>
    );
  }
);

ParentRegisterFormV2.displayName = 'ParentRegisterFormV2';
