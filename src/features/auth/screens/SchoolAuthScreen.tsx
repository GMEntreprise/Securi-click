import { LinearGradient } from 'expo-linear-gradient';
import { useAppNavigation } from '@/navigation/useAppNavigation';
import {
  AlertCircle,
  Briefcase,
  Building2,
  Mail,
  MailCheck,
  MapPin,
  Phone,
  School,
  Shield,
  User,
} from 'lucide-react-native';
import React, { memo, useCallback, useState } from 'react';
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  loginSchema, schoolRegisterSchema,
  type LoginFormData as LoginValues,
  type SchoolRegisterFormData as RegisterValues,
} from '../schemas/auth.schema';
import { Toast } from '@/shared/ui/molecules/Toast';
import { useLogin } from '../hooks/useLogin';
import { useRegisterSchool } from '../hooks/useRegister';
import { useLastEmail } from '../hooks/useLastEmail';
import {
  AuthBackButton,
  AuthCheckbox,
  AuthInputField,
  AuthPasswordField,
  AuthPickerField,
  AuthPrimaryButton,
  AuthStepBar,
  AuthTabToggle,
} from '../components/ui';
import { LegalConsentSheet } from '../components/ui/LegalConsentSheet';
import { LegalMentionsScreen } from '@/features/legal/screens/LegalMentionsScreen';
import { PrivacyPolicyScreen } from '@/features/legal/screens/PrivacyPolicyScreen';
import { useTheme } from '@/theme';
import { SchoolNameSmartField } from '@/features/school/components/ui/SchoolNameSmartField';
import type { SchoolPrefillData } from '@/features/school/components/ui/SchoolNameSmartField';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.3;

const SCHOOL_TYPES = [
  'École maternelle privée',
  'École maternelle publique',
  'École primaire privée',
  'École primaire publique',
];

const MANAGER_FUNCTIONS = [
  'Directeur / Directrice',
  'Directeur adjoint',
  'Principal',
  'Principal adjoint',
  'Enseignant',
  'Enseignant référent',
  'Responsable administratif',
  'Autre',
];


const SchoolLoginForm: React.FC<{
  onSubmit: (d: LoginValues) => void;
  isLoading: boolean;
  error?: string | null;
  defaultEmail?: string;
  onForgotPassword: () => void;
}> = memo(({ onSubmit, isLoading, error, defaultEmail = '', onForgotPassword }) => {
  const t = useTheme();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: defaultEmail, password: '' },
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
        placeholder="direction@etablissement.fr"
        icon={<Mail size={18} color={t.textMuted} />}
        error={errors.email?.message}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <AuthPasswordField
        control={control}
        name="password"
        label="Mot de passe"
        error={errors.password?.message}
        rightLabel={
          <Pressable onPress={onForgotPassword} hitSlop={8}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: t.primary }}>
              Oublié ?
            </Text>
          </Pressable>
        }
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
  defaultEmail?: string;
  onOpenLegal: () => void;
  onOpenPrivacy: () => void;
}> = memo(({ onSubmit, isLoading, error, defaultEmail = '', onOpenLegal, onOpenPrivacy }) => {
  const t = useTheme();
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(schoolRegisterSchema),
    defaultValues: {
      school_name: '',
      city: '',
      postal_code: '',
      manager_first_name: '',
      manager_last_name: '',
      manager_function: 'Directeur / Directrice',
      email: defaultEmail,
      phone: '',
      address: '',
      school_type: '',
      password: '',
      confirm_password: '',
      accept_terms: false,
      accept_privacy: false,
    },
  });

  const schoolNameValue = watch('school_name');

  const handlePrefill = useCallback((data: SchoolPrefillData) => {
    setValue('school_name', data.name, { shouldValidate: true });
    setValue('school_type', data.type, { shouldValidate: true });
    setValue('address', data.address, { shouldValidate: true });
    setValue('city', data.city, { shouldValidate: true });
    setValue('postal_code', data.postal_code, { shouldValidate: true });
  }, [setValue]);

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

      <SchoolNameSmartField
        value={schoolNameValue}
        onChangeText={text => setValue('school_name', text, { shouldValidate: !!errors.school_name })}
        onPrefill={handlePrefill}
        error={errors.school_name?.message}
      />

      <AuthPickerField
        control={control}
        name="school_type"
        label="Type d'établissement"
        options={SCHOOL_TYPES}
        icon={<School size={18} color={t.textMuted} />}
        placeholder="Sélectionnez le type"
        error={errors.school_type?.message}
      />

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <AuthInputField
            control={control}
            name="city"
            label="Ville"
            placeholder="Paris"
            icon={<MapPin size={18} color={t.textMuted} />}
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

      <AuthInputField
        control={control}
        name="address"
        label="Adresse"
        placeholder="12 rue de la Paix"
        icon={<MapPin size={18} color={t.textMuted} />}
        error={errors.address?.message}
      />

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 8,
          marginBottom: 16,
          backgroundColor: t.amberBg,
          borderWidth: 1,
          borderColor: t.isDark ? 'rgba(245,158,11,0.2)' : '#fde68a',
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderRadius: 14,
        }}
      >
        <AlertCircle size={14} color={t.amber} style={{ marginTop: 2 }} />
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
            icon={<User size={18} color={t.textMuted} />}
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

      <AuthPickerField
        control={control}
        name="manager_function"
        label="Fonction"
        options={MANAGER_FUNCTIONS}
        icon={<Briefcase size={18} color={t.textMuted} />}
        placeholder="Sélectionnez votre fonction"
        error={errors.manager_function?.message}
      />
      <AuthInputField
        control={control}
        name="email"
        label="Email"
        placeholder="direction@etablissement.fr"
        icon={<Mail size={18} color={t.textMuted} />}
        error={errors.email?.message}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <AuthInputField
        control={control}
        name="phone"
        label="Téléphone"
        placeholder="01 23 45 67 89"
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
      <AuthPasswordField
        control={control}
        name="confirm_password"
        label="Confirmer le mot de passe"
        error={errors.confirm_password?.message}
      />

      <AuthCheckbox
        control={control}
        name="accept_terms"
        error={errors.accept_terms?.message}
        label={
          <Text
            style={{ fontSize: 13, color: t.textSecondary, lineHeight: 18 }}
          >
            J'accepte les{' '}
            <Text
              style={{ color: t.primary, fontWeight: '700' }}
              onPress={onOpenLegal}
            >
              Conditions Générales d'Utilisation
            </Text>{' '}
            professionnelles.
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
            J'accepte la{' '}
            <Text
              style={{ color: t.primary, fontWeight: '700' }}
              onPress={onOpenPrivacy}
            >
              Politique de confidentialité
            </Text>
            .
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
  const nav = useAppNavigation();
  const insets = useSafeAreaInsets();
  const t = useTheme();
  const [activeTab, setActiveTab] = useState<0 | 1>(0);
  const [registerEmail, setRegisterEmail] = useState<string | null>(null);
  const [pendingData, setPendingData] = useState<RegisterValues | null>(null);
  const [legalSheetVisible, setLegalSheetVisible] = useState(false);
  const [legalModalVisible, setLegalModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);

  const lastEmail = useLastEmail();
  const loginMutation = useLogin();
  const registerMutation = useRegisterSchool();

  const handleLogin = useCallback(
    (data: LoginValues) => {
      loginMutation.mutate(data, {
        onSuccess: () => nav.goToSchoolDashboard(),
      });
    },
    [loginMutation, nav]
  );

  const handleRegisterFormSubmit = useCallback((data: RegisterValues) => {
    setPendingData(data);
    setLegalSheetVisible(true);
  }, []);

  const handleLegalAccept = useCallback(() => {
    if (!pendingData) return;
    setLegalSheetVisible(false);
    registerMutation.mutate(
      { ...pendingData, accept_terms: true, accept_privacy: true } as any,
      {
        onSuccess: () => {
          setRegisterEmail(pendingData.email);
          setPendingData(null);
          Toast.show('Email de confirmation envoyé ! Vérifiez votre boîte mail.', {
            type: 'success',
            duration: 4000,
          });
        },
        onError: (e: any) => {
          setPendingData(null);
          Toast.show(e?.message ?? 'Impossible de créer le compte. Réessayez.', {
            type: 'error',
            duration: 5000,
          });
        },
      }
    );
  }, [pendingData, registerMutation]);

  const handleRegister = handleRegisterFormSubmit;

  const handleTabToggle = useCallback(
    (index: 0 | 1) => setActiveTab(index),
    []
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: t.bg }}
    >
      <AuthBackButton onPress={() => nav.pushRoute('/(auth)')} />

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
            'transparent',
            t.isDark ? 'rgba(13,17,23,0.6)' : 'rgba(249,245,240,0.5)',
            t.bg,
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

        {registerEmail ? (
          <Animated.View
            entering={FadeInDown.duration(400)}
            style={{ paddingHorizontal: 24, paddingTop: 40, alignItems: 'center' }}
          >
            <MailCheck size={56} color={t.green} strokeWidth={1.5} />
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
              Confirmez votre email
            </Text>
            <Text
              style={{
                fontSize: 15,
                color: t.textSecondary,
                textAlign: 'center',
                lineHeight: 22,
                marginBottom: 8,
              }}
            >
              Un lien de confirmation a été envoyé à
            </Text>
            <Text
              style={{
                fontSize: 15,
                fontWeight: '700',
                color: t.text,
                textAlign: 'center',
                marginBottom: 24,
              }}
            >
              {registerEmail}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: t.textSecondary,
                textAlign: 'center',
                lineHeight: 20,
              }}
            >
              Cliquez sur le lien dans l'email pour activer votre espace et accéder à votre tableau de bord.
            </Text>
          </Animated.View>
        ) : (
          <>
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
                  key={lastEmail}
                  onSubmit={handleLogin}
                  isLoading={loginMutation.isPending}
                  error={loginMutation.error?.message}
                  defaultEmail={lastEmail}
                  onForgotPassword={() => nav.goToForgotPassword()}
                />
              ) : (
                <SchoolRegisterForm
                  key={lastEmail}
                  onSubmit={handleRegister}
                  isLoading={registerMutation.isPending}
                  error={registerMutation.error?.message}
                  defaultEmail={lastEmail}
                  onOpenLegal={() => setLegalModalVisible(true)}
                  onOpenPrivacy={() => setPrivacyModalVisible(true)}
                />
              )}
            </Animated.View>
          </>
        )}
      </ScrollView>

      <LegalConsentSheet
        visible={legalSheetVisible}
        onAccept={handleLegalAccept}
        onClose={() => setLegalSheetVisible(false)}
        onOpenLegal={() => setLegalModalVisible(true)}
        onOpenPrivacy={() => setPrivacyModalVisible(true)}
        role="school"
      />

      <Modal
        visible={legalModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setLegalModalVisible(false)}
      >
        <LegalMentionsScreen />
      </Modal>

      <Modal
        visible={privacyModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPrivacyModalVisible(false)}
      >
        <PrivacyPolicyScreen />
      </Modal>
    </KeyboardAvoidingView>
  );
});

SchoolAuthScreen.displayName = 'SchoolAuthScreen';
