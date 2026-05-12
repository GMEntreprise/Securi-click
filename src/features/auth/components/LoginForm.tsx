import React, { memo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  loginSchema,
  type LoginFormValues,
} from '@/features/auth/schemas/login.schema';

interface LoginFormProps {
  onSubmit: (data: LoginFormValues) => void;
  isLoading: boolean;
  errorMessage?: string | null;
}

export const LoginForm = memo(function LoginForm({
  onSubmit,
  isLoading,
  errorMessage,
}: LoginFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const submit = useCallback(
    (values: LoginFormValues) => {
      onSubmit(values);
    },
    [onSubmit]
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="w-full"
    >
      <View className="gap-4 w-full">
        {errorMessage ? (
          <Text className="text-center text-red-600 text-sm">
            {errorMessage}
          </Text>
        ) : null}

        <View>
          <Text className="text-gray-900 dark:text-gray-100 mb-1 text-sm font-medium">
            Email
          </Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-3 text-gray-900 dark:text-white bg-white dark:bg-gray-900"
                placeholder="vous@exemple.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.email ? (
            <Text className="text-red-600 text-xs mt-1">
              {errors.email.message}
            </Text>
          ) : null}
        </View>

        <View>
          <Text className="text-gray-900 dark:text-gray-100 mb-1 text-sm font-medium">
            Mot de passe
          </Text>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-3 text-gray-900 dark:text-white bg-white dark:bg-gray-900"
                placeholder="••••••••"
                secureTextEntry
                editable={!isLoading}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.password ? (
            <Text className="text-red-600 text-xs mt-1">
              {errors.password.message}
            </Text>
          ) : null}
        </View>

        <Pressable
          onPress={handleSubmit(submit)}
          disabled={isLoading}
          className="bg-[#208AEF] rounded-xl py-4 items-center mt-2 opacity-100 disabled:opacity-60"
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-semibold text-base">
              Se connecter
            </Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
});
