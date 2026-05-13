import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  AlertCircle,
  Building2,
  Mail,
  MapPin,
  Phone,
  Shield,
  User,
} from 'lucide-react-native';
import React, { memo, useCallback, useState } from 'react';
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLogin } from '../hooks/useLogin';
import { useRegisterSchool } from '../hooks/useRegister';
import {
  AuthBackButton,
  AuthCheckbox,
  AuthInputField,
  AuthPasswordField,
  AuthPrimaryButton,
  AuthStepBar,
  AuthTabToggle,
} from '../components/ui';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.3;

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe trop court'),
});

const registerSchema = z.object({
  school_name: z.string().min(2, "Nom de l'établissement requis"),
  city: z.string().min(2, 'Ville requise'),
  postal_code: z.string().min(5, 'Code postal requis'),
  manager_first_name: z.string().min(2, 'Prénom requis'),
  manager_last_name: z.string().min(2, 'Nom requis'),
  manager_function: z.string().min(2, 'Fonction requise'),
  email: z.string().email('Email invalide'),
  phone: z.string().min(9, 'Téléphone requis'),
  address: z.string().min(5, 'Adresse requise'),
  school_type: z.string().min(2, 'Type requis'),
  password: z.string().min(8, '8 caractères minimum'),
  confirm_password: z.string(),
  accept_terms: z.boolean().refine(v => v, 'Accepter les CGU'),
  accept_privacy: z.boolean().refine(v => v, 'Accepter la politique'),
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

function useTheme() {
  const dark = useColorScheme() === 'dark';
  return {
    dark,
    bg: dark ? '#0f0f0f' : '#f9f5f0',
    text: dark ? '#f9fafb' : '#111827',
    textSecondary: dark ? '#9ca3af' : '#6b7280',
    iconColor: dark ? '#4b5563' : '#9ca3af',
    errorBg: dark ? 'rgba(239,68,68,0.1)' : '#fef2f2',
    errorBorder: dark ? 'rgba(239,68,68,0.3)' : '#fecaca',
    hintBg: dark ? 'rgba(245,158,11,0.1)' : '#fffbeb',
    hintBorder: dark ? 'rgba(245,158,11,0.2)' : '#fde68a',
    checkboxLabel: dark ? '#d1d5db' : '#374151',
    gradientEnd: dark ? '#0f0f0f' : '#f9f5f0',
  };
}

const SchoolLoginForm: React.FC<{
  onSubmit: (d: LoginValues) => void;
  isLoading: boolean;
  error?: string | null;
}> = memo(({ onSubmit, isLoading, error }) => {
  const t = useTheme();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

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
        Espace Professionnel
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: t.textSecondary,
          marginBottom: 24,
          lineHeight: 20,
        }}
      >
        Gérez la sécurité de votre établissement en toute simplicité.
      </Text>

      {error && (
        <View
          style={{
            marginBottom: 16,
            backgroundColor: t.errorBg,
            borderWidth: 1,
            borderColor: t.errorBorder,
            borderRadius: 16,
            paddingHorizontal: 14,
            paddingVertical: 12,
          }}
        >
          <Text style={{ color: '#ef4444', fontSize: 13, fontWeight: '600' }}>
            {error}
          </Text>
        </View>
      )}

      <AuthInputField
        control={control}
        name="email"
        label="Email"
        placeholder="direction@etablissement.fr"
        icon={<Mail size={18} color={t.iconColor} />}
        error={errors.email?.message}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <AuthPasswordField
        control={control}
        name="password"
        label="Mot de passe"
        error={errors.password?.message}
      />

      <View style={{ marginTop: 8 }}>
        <AuthPrimaryButton
          onPress={handleSubmit(onSubmit)}
          isLoading={isLoading}
          variant="primary"
          icon={<Shield size={18} color="#fff" strokeWidth={2} />}
        >
          Accéder à mon espace
        </AuthPrimaryButton>
      </View>
    </View>
  );
});
SchoolLoginForm.displayName = 'SchoolLoginForm';

const SchoolRegisterForm: React.FC<{
  onSubmit: (d: RegisterValues) => void;
  isLoading: boolean;
  error?: string | null;
}> = memo(({ onSubmit, isLoading, error }) => {
  const t = useTheme();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      school_name: '',
      city: '',
      postal_code: '',
      manager_first_name: '',
      manager_last_name: '',
      manager_function: 'Directeur / Responsable',
      email: '',
      phone: '',
      address: '',
      school_type: 'École primaire',
      password: '',
      confirm_password: '',
      accept_terms: false,
      accept_privacy: false,
    },
  });

  return (
    <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
      <AuthStepBar currentStep={1} totalSteps={2} accentColor="#1e3a8a" />

      <Text
        style={{
          fontSize: 26,
          fontWeight: '800',
          letterSpacing: -0.5,
          color: t.text,
          marginBottom: 6,
        }}
      >
        Inscrire mon établissement
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: t.textSecondary,
          marginBottom: 24,
          lineHeight: 20,
        }}
      >
        Gérez la sécurité de votre établissement en toute simplicité.
      </Text>

      {error && (
        <View
          style={{
            marginBottom: 16,
            backgroundColor: t.errorBg,
            borderWidth: 1,
            borderColor: t.errorBorder,
            borderRadius: 16,
            paddingHorizontal: 14,
            paddingVertical: 12,
          }}
        >
          <Text style={{ color: '#ef4444', fontSize: 13, fontWeight: '600' }}>
            {error}
          </Text>
        </View>
      )}

      <AuthInputField
        control={control}
        name="school_name"
        label="Nom de l'établissement"
        placeholder="ex: École du Centre"
        icon={<Building2 size={18} color={t.iconColor} />}
        error={errors.school_name?.message}
      />

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <AuthInputField
            control={control}
            name="city"
            label="Ville"
            placeholder="Paris"
            icon={<MapPin size={18} color={t.iconColor} />}
            error={errors.city?.message}
          />
        </View>
        <View style={{ width: 110 }}>
          <AuthInputField
            control={control}
            name="postal_code"
            label="Code postal"
            placeholder="75001"
            error={errors.postal_code?.message}
            keyboardType="numeric"
            maxLength={5}
          />
        </View>
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 8,
          marginBottom: 16,
          backgroundColor: t.hintBg,
          borderWidth: 1,
          borderColor: t.hintBorder,
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderRadius: 14,
        }}
      >
        <AlertCircle size={14} color="#f59e0b" style={{ marginTop: 2 }} />
        <Text
          style={{
            fontSize: 12,
            color: t.textSecondary,
            flex: 1,
            fontStyle: 'italic',
            lineHeight: 17,
          }}
        >
          Renseignez l'adresse officielle de votre structure pour la
          certification.
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <AuthInputField
            control={control}
            name="manager_first_name"
            label="Prénom"
            placeholder=""
            icon={<User size={18} color={t.iconColor} />}
            error={errors.manager_first_name?.message}
          />
        </View>
        <View style={{ flex: 1 }}>
          <AuthInputField
            control={control}
            name="manager_last_name"
            label="Nom"
            placeholder=""
            error={errors.manager_last_name?.message}
          />
        </View>
      </View>

      <AuthInputField
        control={control}
        name="manager_function"
        label="Fonction"
        placeholder="Directeur / Responsable"
        error={errors.manager_function?.message}
      />
      <AuthInputField
        control={control}
        name="email"
        label="Email"
        placeholder="direction@etablissement.fr"
        icon={<Mail size={18} color={t.iconColor} />}
        error={errors.email?.message}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <AuthInputField
        control={control}
        name="phone"
        label="Téléphone"
        placeholder="01 23 45 67 89"
        icon={<Phone size={18} color={t.iconColor} />}
        error={errors.phone?.message}
        keyboardType="phone-pad"
      />
      <AuthPasswordField
        control={control}
        name="password"
        label="Mot de passe"
        error={errors.password?.message}
      />

      <AuthCheckbox
        control={control}
        name="accept_terms"
        accentColor="#1e3a8a"
        error={errors.accept_terms?.message}
        label={
          <Text
            style={{ fontSize: 13, color: t.checkboxLabel, lineHeight: 18 }}
          >
            J'accepte les{' '}
            <Text style={{ color: '#1e3a8a', fontWeight: '700' }}>
              Conditions Générales d'Utilisation
            </Text>{' '}
            professionnelles.
          </Text>
        }
      />

      <View style={{ marginTop: 8 }}>
        <AuthPrimaryButton
          onPress={handleSubmit(onSubmit)}
          isLoading={isLoading}
          variant="primary"
          icon={<Shield size={18} color="#fff" strokeWidth={2} />}
        >
          Sécurisez votre établissement
        </AuthPrimaryButton>
      </View>
    </View>
  );
});
SchoolRegisterForm.displayName = 'SchoolRegisterForm';

export const SchoolAuthScreen: React.FC = memo(() => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const t = useTheme();
  const [activeTab, setActiveTab] = useState<0 | 1>(0);

  const loginMutation = useLogin();
  const registerMutation = useRegisterSchool();

  const handleLogin = useCallback(
    (data: LoginValues) => {
      loginMutation.mutate(data, {
        onSuccess: () => router.replace('/(app)/dashboard' as any),
      });
    },
    [loginMutation, router]
  );

  const handleRegister = useCallback(
    (data: RegisterValues) => {
      registerMutation.mutate(data as any, {
        onSuccess: () => router.replace('/(app)/dashboard' as any),
      });
    },
    [registerMutation, router]
  );

  const handleTabToggle = useCallback(
    (index: 0 | 1) => setActiveTab(index),
    []
  );

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
        <Image
          source={require('../../../../assets/images/icon.png')}
          style={{ width: '100%', height: HERO_HEIGHT }}
          resizeMode="cover"
        />
        <LinearGradient
          colors={[
            t.dark ? 'rgba(0,0,0,0)' : 'transparent',
            t.dark ? `rgba(15,15,15,0.6)` : 'rgba(249,245,240,0.5)',
            t.gradientEnd,
          ]}
          locations={[0.4, 0.75, 1]}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: HERO_HEIGHT,
          }}
          pointerEvents="none"
        />

        <Animated.View entering={FadeInDown.duration(400)}>
          <AuthTabToggle
            leftLabel="Connexion"
            rightLabel="Créer établissement"
            activeIndex={activeTab}
            onToggle={handleTabToggle}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(400)}>
          {activeTab === 0 ? (
            <SchoolLoginForm
              onSubmit={handleLogin}
              isLoading={loginMutation.isPending}
              error={loginMutation.error?.message}
            />
          ) : (
            <SchoolRegisterForm
              onSubmit={handleRegister}
              isLoading={registerMutation.isPending}
              error={registerMutation.error?.message}
            />
          )}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
});

SchoolAuthScreen.displayName = 'SchoolAuthScreen';
