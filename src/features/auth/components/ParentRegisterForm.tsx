import React, { memo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Controller } from 'react-hook-form';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  parentRegisterSchema,
  type ParentRegisterFormData,
} from '../schemas/auth.schema';

interface Props {
  onSubmit: (data: ParentRegisterFormData) => void;
  isLoading: boolean;
  error?: string;
}

export const ParentRegisterForm: React.FC<Props> = memo(
  ({ onSubmit, isLoading, error }) => {
    const {
      control,
      handleSubmit,
      formState: { errors },
    } = useForm<ParentRegisterFormData>({
      resolver: zodResolver(parentRegisterSchema),
      defaultValues: {
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        confirm_password: '',
        accept_terms: false,
        accept_privacy: false,
      },
    });

    return (
      <ScrollView className="flex-1 bg-background">
        <View className="p-6 space-y-4">
          <View className="items-center mb-6">
            <Text className="text-2xl font-bold text-foreground mb-2">
              Créer un compte Parent
            </Text>
            <Text className="text-muted-foreground text-center">
              Gérez vos enfants et leurs autorisations
            </Text>
          </View>

          {error && (
            <Text className="text-red-500 text-center mb-4">{error}</Text>
          )}

          <View className="space-y-4">
            <View className="flex-row space-x-4">
              <View className="flex-1">
                <Input
                  label="Prénom"
                  placeholder="Jean"
                  control={control}
                  name="first_name"
                  error={errors.first_name?.message}
                />
              </View>
              <View className="flex-1">
                <Input
                  label="Nom"
                  placeholder="Dupont"
                  control={control}
                  name="last_name"
                  error={errors.last_name?.message}
                />
              </View>
            </View>

            <Input
              label="Email"
              placeholder="jean.dupont@email.com"
              control={control}
              name="email"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email?.message}
            />

            <Input
              label="Téléphone"
              placeholder="+33 6 12 34 56 78"
              control={control}
              name="phone"
              keyboardType="phone-pad"
              error={errors.phone?.message}
            />

            <Input
              label="Mot de passe"
              placeholder="••••••••"
              control={control}
              name="password"
              secureTextEntry
              error={errors.password?.message}
            />

            <Input
              label="Confirmer le mot de passe"
              placeholder="••••••••"
              control={control}
              name="confirm_password"
              secureTextEntry
              error={errors.confirm_password?.message}
            />

            <View className="space-y-2">
              <Controller
                control={control}
                name="accept_terms"
                render={({ field: { onChange, value } }) => (
                  <Pressable
                    onPress={() => onChange(!value)}
                    className="flex-row items-center space-x-2"
                  >
                    <View
                      className={`w-5 h-5 rounded border-2 ${value ? 'bg-primary border-primary' : 'border-gray-300'}`}
                    >
                      {value && <Text className="text-white text-xs">✓</Text>}
                    </View>
                    <Text className="text-sm text-foreground">
                      J'accepte les{' '}
                      <Text className="text-primary underline">
                        Conditions Générales d'Utilisation
                      </Text>
                    </Text>
                  </Pressable>
                )}
              />
              {errors.accept_terms?.message && (
                <Text className="text-red-500 text-xs">
                  {errors.accept_terms?.message}
                </Text>
              )}

              <Controller
                control={control}
                name="accept_privacy"
                render={({ field: { onChange, value } }) => (
                  <Pressable
                    onPress={() => onChange(!value)}
                    className="flex-row items-center space-x-2"
                  >
                    <View
                      className={`w-5 h-5 rounded border-2 ${value ? 'bg-primary border-primary' : 'border-gray-300'}`}
                    >
                      {value && <Text className="text-white text-xs">✓</Text>}
                    </View>
                    <Text className="text-sm text-foreground">
                      J'accepte la{' '}
                      <Text className="text-primary underline">
                        Politique de Confidentialité
                      </Text>
                    </Text>
                  </Pressable>
                )}
              />
              {errors.accept_privacy?.message && (
                <Text className="text-red-500 text-xs">
                  {errors.accept_privacy?.message}
                </Text>
              )}
            </View>
          </View>

          <Button
            onPress={handleSubmit(onSubmit)}
            isLoading={isLoading}
            className="mt-6"
          >
            Créer mon compte
          </Button>

          <View className="mt-4 items-center">
            <Text className="text-muted-foreground text-sm">
              Vous avez déjà un compte ?{' '}
              <Text
                className="text-primary font-semibold"
                onPress={() => {
                  /* Navigate to login */
                }}
              >
                Se connecter
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  }
);
