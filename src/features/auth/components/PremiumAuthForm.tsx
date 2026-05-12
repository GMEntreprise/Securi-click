import React, { memo, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { PasswordInput } from './PasswordInput';
import { ForceMeter } from './ForceMeter';
import { AuthToggle } from './AuthToggle';
import { NativeButton } from '@/components/ui/NativeButton';

interface Props {
  role: 'parent' | 'collector' | 'school';
  isLogin: boolean;
  onSubmit: (data: any) => void;
  isLoading: boolean;
  error?: string;
}

const getSchema = (role: string, isLogin: boolean) => {
  const baseSchema = z.object({
    email: z.string().email('Email invalide'),
    password: z.string().min(6, 'Mot de passe trop court'),
  });

  if (!isLogin && role === 'parent') {
    return baseSchema
      .extend({
        first_name: z.string().min(2, 'Prénom requis'),
        last_name: z.string().min(2, 'Nom requis'),
        phone: z.string().min(10, 'Téléphone requis'),
        confirm_password: z.string(),
      })
      .refine(data => data.password === data.confirm_password, {
        message: 'Les mots de passe ne correspondent pas',
        path: ['confirm_password'],
      });
  }

  if (!isLogin && role === 'school') {
    return baseSchema
      .extend({
        school_name: z.string().min(2, "Nom de l'établissement requis"),
        school_type: z.string().min(2, "Type d'établissement requis"),
        phone: z.string().min(10, 'Téléphone requis'),
        address: z.string().min(5, 'Adresse requise'),
        city: z.string().min(2, 'Ville requise'),
        postal_code: z.string().min(5, 'Code postal requis'),
        manager_first_name: z.string().min(2, 'Prénom du responsable requis'),
        manager_last_name: z.string().min(2, 'Nom du responsable requis'),
        manager_function: z.string().min(2, 'Fonction du responsable requise'),
        confirm_password: z.string(),
      })
      .refine(data => data.password === data.confirm_password, {
        message: 'Les mots de passe ne correspondent pas',
        path: ['confirm_password'],
      });
  }

  return baseSchema;
};

export const PremiumAuthForm: React.FC<Props> = memo(
  ({ role, isLogin, onSubmit, isLoading, error }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState<
      'weak' | 'medium' | 'strong'
    >('weak');

    const slideAnim = useSharedValue(50);
    const formStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: slideAnim.value }],
    }));

    const schema = getSchema(role, isLogin);
    const {
      control,
      handleSubmit,
      watch,
      formState: { errors },
    } = useForm({
      resolver: zodResolver(schema),
      defaultValues: {
        email: '',
        password: '',
        ...(isLogin
          ? {}
          : {
              first_name: '',
              last_name: '',
              phone: '',
              confirm_password: '',
              ...(role === 'school'
                ? {
                    school_name: '',
                    school_type: '',
                    address: '',
                    city: '',
                    postal_code: '',
                    manager_first_name: '',
                    manager_last_name: '',
                    manager_function: '',
                  }
                : {}),
            }),
      },
    });

    const watchedPassword = watch('password');

    const checkPasswordStrength = useCallback((password: string) => {
      if (password.length < 6) {
        setPasswordStrength('weak');
        return;
      }

      const hasUpper = /[A-Z]/.test(password);
      const hasLower = /[a-z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const hasSpecial = /[!@#$%^&*]/.test(password);

      const score = [hasUpper, hasLower, hasNumber, hasSpecial].filter(
        Boolean
      ).length;

      if (score >= 3 && password.length >= 8) {
        setPasswordStrength('strong');
      } else if (score >= 2 && password.length >= 6) {
        setPasswordStrength('medium');
      } else {
        setPasswordStrength('weak');
      }
    }, []);

    React.useEffect(() => {
      if (watchedPassword) {
        checkPasswordStrength(watchedPassword);
      }
    }, [watchedPassword, checkPasswordStrength]);

    React.useEffect(() => {
      slideAnim.value = withSpring(0, {
        damping: 20,
        stiffness: 300,
      });
    }, []);

    const getRoleTitle = () => {
      switch (role) {
        case 'parent':
          return isLogin ? 'Parent' : 'Créer un compte Parent';
        case 'collector':
          return isLogin ? 'Collecteur' : 'Invitation Collecteur';
        case 'school':
          return isLogin ? 'Établissement' : 'Créer un compte Établissement';
        default:
          return '';
      }
    };

    const getRoleDescription = () => {
      switch (role) {
        case 'parent':
          return isLogin
            ? 'Protégez vos enfants en toute sécurité'
            : 'Gérez vos enfants et leurs autorisations';
        case 'collector':
          return isLogin
            ? 'Accès sécurisé temporaire'
            : 'Rejoignez en tant que collecteur invité';
        case 'school':
          return isLogin
            ? 'Administrez votre établissement'
            : 'Sécurisez votre école';
        default:
          return '';
      }
    };

    const getRoleIcon = () => {
      switch (role) {
        case 'parent':
          return '👨‍👩‍👧‍👦';
        case 'collector':
          return '👤';
        case 'school':
          return '🏫';
        default:
          return '';
      }
    };

    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-background"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6 pt-12">
            {/* Header Role-Specific */}
            <Animated.View style={formStyle} className="items-center mb-8">
              <Text className="text-4xl mb-3">{getRoleIcon()}</Text>
              <Text className="text-2xl font-bold text-foreground mb-2 text-center">
                {getRoleTitle()}
              </Text>
              <Text className="text-muted-foreground text-center text-sm leading-relaxed">
                {getRoleDescription()}
              </Text>
            </Animated.View>

            {/* Error Message */}
            {error && (
              <View className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4">
                <Text className="text-red-600 dark:text-red-400 text-center font-medium">
                  {error}
                </Text>
              </View>
            )}

            {/* Form Fields */}
            <View className="space-y-4">
              <View>
                <Text className="text-foreground font-medium mb-2">Email</Text>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View
                      className={`bg-white dark:bg-gray-900 border-2 rounded-2xl px-4 py-4 ${
                        errors.email
                          ? 'border-red-500'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <TextInput
                        className="text-foreground text-base"
                        placeholder="votre@email.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        placeholderTextColor="#9CA3AF"
                        selectionColor="#1E3A8A"
                      />
                    </View>
                  )}
                />
                {errors.email && (
                  <Text className="text-red-500 text-sm mt-1 ml-4">
                    {errors.email.message}
                  </Text>
                )}
              </View>

              <View>
                <Text className="text-foreground font-medium mb-2">
                  Mot de passe
                </Text>
                <PasswordInput
                  control={control}
                  name="password"
                  error={errors.password?.message}
                  disabled={isLoading}
                />
                {!isLogin && passwordStrength && (
                  <ForceMeter strength={passwordStrength} />
                )}
              </View>

              {/* Registration Fields */}
              {!isLogin && role === 'parent' && (
                <>
                  <View className="flex-row gap-4">
                    <View className="flex-1">
                      <Text className="text-foreground font-medium mb-2">
                        Prénom
                      </Text>
                      <Controller
                        control={control}
                        name="first_name"
                        render={({ field: { onChange, onBlur, value } }) => (
                          <View
                            className={`bg-white dark:bg-gray-900 border-2 rounded-2xl px-4 py-4 ${
                              errors.first_name
                                ? 'border-red-500'
                                : 'border-gray-200 dark:border-gray-700'
                            }`}
                          >
                            <TextInput
                              className="text-foreground text-base"
                              placeholder="Jean"
                              value={value}
                              onChangeText={onChange}
                              onBlur={onBlur}
                              placeholderTextColor="#9CA3AF"
                              selectionColor="#1E3A8A"
                            />
                          </View>
                        )}
                      />
                      {errors.first_name && (
                        <Text className="text-red-500 text-sm mt-1">
                          {errors.first_name.message}
                        </Text>
                      )}
                    </View>

                    <View className="flex-1">
                      <Text className="text-foreground font-medium mb-2">
                        Nom
                      </Text>
                      <Controller
                        control={control}
                        name="last_name"
                        render={({ field: { onChange, onBlur, value } }) => (
                          <View
                            className={`bg-white dark:bg-gray-900 border-2 rounded-2xl px-4 py-4 ${
                              errors.last_name
                                ? 'border-red-500'
                                : 'border-gray-200 dark:border-gray-700'
                            }`}
                          >
                            <TextInput
                              className="text-foreground text-base"
                              placeholder="Dupont"
                              value={value}
                              onChangeText={onChange}
                              onBlur={onBlur}
                              placeholderTextColor="#9CA3AF"
                              selectionColor="#1E3A8A"
                            />
                          </View>
                        )}
                      />
                      {errors.last_name && (
                        <Text className="text-red-500 text-sm mt-1">
                          {errors.last_name.message}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View>
                    <Text className="text-foreground font-medium mb-2">
                      Téléphone
                    </Text>
                    <Controller
                      control={control}
                      name="phone"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <View
                          className={`bg-white dark:bg-gray-900 border-2 rounded-2xl px-4 py-4 ${
                            errors.phone
                              ? 'border-red-500'
                              : 'border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <TextInput
                            className="text-foreground text-base"
                            placeholder="+33 6 12 34 56 78"
                            keyboardType="phone-pad"
                            value={value}
                            onChangeText={onChange}
                            onBlur={onBlur}
                            placeholderTextColor="#9CA3AF"
                            selectionColor="#1E3A8A"
                          />
                        </View>
                      )}
                    />
                    {errors.phone && (
                      <Text className="text-red-500 text-sm mt-1">
                        {errors.phone.message}
                      </Text>
                    )}
                  </View>

                  <View>
                    <Text className="text-foreground font-medium mb-2">
                      Confirmer le mot de passe
                    </Text>
                    <PasswordInput
                      control={control}
                      name="confirm_password"
                      placeholder="•••••••••"
                      error={errors.confirm_password?.message}
                      disabled={isLoading}
                    />
                  </View>
                </>
              )}

              {/* Submit Button */}
              <NativeButton
                onPress={handleSubmit(onSubmit)}
                isLoading={isLoading}
                className="mt-8"
              >
                {isLogin ? 'Se connecter' : 'Créer mon compte'}
              </NativeButton>

              {/* Toggle */}
              <AuthToggle
                isLogin={isLogin}
                onToggle={() => {
                  // Navigation handled by parent
                }}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }
);
