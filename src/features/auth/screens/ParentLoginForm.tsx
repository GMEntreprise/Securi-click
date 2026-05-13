import { ArrowRight, CheckCircle, Mail } from 'lucide-react-native';
import React, { memo, useCallback } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AuthInputField,
  AuthPasswordField,
  AuthPrimaryButton,
} from '../components/ui';
import { useTheme } from '@/theme';

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe trop court'),
});

type LoginValues = z.infer<typeof loginSchema>;

interface ParentLoginFormProps {
  onSubmit: (data: LoginValues) => void;
  isLoading: boolean;
  error?: string | null;
  onForgotPassword?: () => void;
}

export const ParentLoginForm: React.FC<ParentLoginFormProps> = memo(
  ({ onSubmit, isLoading, error, onForgotPassword }) => {
    const t = useTheme();
    const {
      control,
      handleSubmit,
      formState: { errors },
    } = useForm<LoginValues>({
      resolver: zodResolver(loginSchema),
      defaultValues: { email: '', password: '' },
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
          Bon retour parmi nous
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: t.textSecondary,
            marginBottom: 24,
            lineHeight: 20,
          }}
        >
          Connectez-vous pour gérer la sécurité de vos enfants.
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
          label="Email"
          placeholder="jean.dupont@exemple.fr"
          icon={<Mail size={18} color={t.textMuted} />}
          error={errors.email?.message}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />

        <AuthPasswordField
          control={control}
          name="password"
          label="Mot de passe"
          error={errors.password?.message}
          rightLabel={
            <Pressable onPress={onForgotPassword} hitSlop={8}>
              <Text
                style={{ fontSize: 12, fontWeight: '700', color: t.accent }}
              >
                Oublié ?
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
          <CheckCircle size={16} color={t.green} strokeWidth={2} />
          <Text style={{ fontSize: 13, color: t.green, fontWeight: '600' }}>
            Protégez vos enfants en 2 min
          </Text>
        </View>

        <AuthPrimaryButton
          onPress={handleSubmit(submit)}
          isLoading={isLoading}
          variant="accent"
          icon={<ArrowRight size={18} color="#fff" strokeWidth={2.5} />}
        >
          Se connecter
        </AuthPrimaryButton>
      </View>
    );
  }
);

ParentLoginForm.displayName = 'ParentLoginForm';
