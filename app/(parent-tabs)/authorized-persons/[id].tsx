import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  User,
  Phone,
  Check,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react-native';
import { useTheme } from '@/theme';
import { AuthInputField } from '@/features/auth/components/ui/AuthInputField';
import {
  useUpdateGuardian,
  useToggleGuardian,
  useDeleteGuardian,
} from '@/features/parent/hooks/useGuardians';
import { parentService } from '@/features/parent/services/parent.service';

const RELATIONSHIPS = [
  'Grand-père',
  'Grand-mère',
  'Oncle',
  'Tante',
  'Frère',
  'Sœur',
  'Cousin(e)',
  'Nourrice',
  'Autre',
];

const schema = z.object({
  first_name: z.string().min(2, 'Minimum 2 caractères'),
  last_name: z.string().min(2, 'Minimum 2 caractères'),
  phone: z.string().min(10, 'Numéro invalide'),
  relationship: z.string().min(1, 'Sélectionnez une relation'),
});

type FormData = z.infer<typeof schema>;

export default function GuardianDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { id, childId } = useLocalSearchParams<{
    id: string;
    childId: string;
  }>();

  const { data: guardian, isLoading } = useQuery({
    queryKey: ['guardian', id],
    queryFn: () => parentService.getGuardian(id ?? ''),
    enabled: !!id,
  });

  const updateGuardian = useUpdateGuardian(childId ?? '');
  const toggleGuardian = useToggleGuardian(childId ?? '');
  const deleteGuardian = useDeleteGuardian(childId ?? '');

  const [selectedRelationship, setSelectedRelationship] = useState('');

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: '',
      last_name: '',
      phone: '',
      relationship: '',
    },
  });

  useEffect(() => {
    if (guardian) {
      reset({
        first_name: guardian.first_name,
        last_name: guardian.last_name,
        phone: guardian.phone,
        relationship: guardian.relationship,
      });
      setSelectedRelationship(guardian.relationship);
    }
  }, [guardian, reset]);

  const handleRelationshipSelect = useCallback(
    (rel: string) => {
      setSelectedRelationship(rel);
      setValue('relationship', rel, { shouldValidate: true });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [setValue]
  );

  const onSubmit = useCallback(
    async (data: FormData) => {
      if (!id) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await updateGuardian.mutateAsync({
        guardianId: id,
        payload: {
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
          relationship: data.relationship,
        },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    },
    [id, updateGuardian, router]
  );

  const handleToggle = useCallback(() => {
    if (!id || !guardian) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleGuardian.mutate({ guardianId: id, isActive: !guardian.is_active });
  }, [id, guardian, toggleGuardian]);

  const handleDelete = useCallback(() => {
    if (!id || !guardian) return;
    Alert.alert(
      "Supprimer l'autorisation",
      `Retirer l'accès à ${guardian.first_name} ${guardian.last_name} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            deleteGuardian.mutate(id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
          },
        },
      ]
    );
  }, [id, guardian, deleteGuardian, router]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={theme.accent} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <Animated.View
        entering={FadeInDown.duration(400)}
        style={{
          backgroundColor: theme.card,
          borderBottomWidth: 1,
          borderBottomColor: theme.cardBorder,
          paddingTop: insets.top + 16,
          paddingBottom: 16,
          paddingHorizontal: 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              backgroundColor: theme.iconBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowLeft size={20} color={theme.text} strokeWidth={2} />
          </TouchableOpacity>
          <View>
            <Text
              style={{
                color: theme.textMuted,
                fontSize: 11,
                fontWeight: '700',
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                marginBottom: 2,
              }}
            >
              Personne autorisée
            </Text>
            <Text
              style={{ color: theme.text, fontSize: 18, fontWeight: '800' }}
            >
              {guardian ? `${guardian.first_name} ${guardian.last_name}` : '—'}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            onPress={handleToggle}
            style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              backgroundColor: guardian?.is_active
                ? theme.greenBg
                : theme.iconBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {guardian?.is_active ? (
              <ToggleRight size={20} color={theme.green} />
            ) : (
              <ToggleLeft size={20} color={theme.textMuted} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDelete}
            style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              backgroundColor: theme.redBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Trash2 size={18} color={theme.red} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingBottom: insets.bottom + 100,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Status banner */}
        {guardian && (
          <Animated.View
            entering={FadeInDown.delay(60).duration(300)}
            style={{
              backgroundColor: guardian.is_active
                ? theme.greenBg
                : theme.iconBg,
              borderRadius: 14,
              padding: 12,
              marginBottom: 20,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: guardian.is_active
                  ? theme.green
                  : theme.textMuted,
              }}
            />
            <Text
              style={{
                color: guardian.is_active ? theme.green : theme.textMuted,
                fontWeight: '600',
                fontSize: 13,
              }}
            >
              {guardian.is_active
                ? "Accès actif — peut récupérer l'enfant"
                : 'Accès désactivé'}
            </Text>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(80).duration(400)}>
          <AuthInputField
            control={control}
            name="first_name"
            label="Prénom"
            icon={<User size={16} color={theme.textMuted} />}
            placeholder="Ex. Jean"
            error={errors.first_name?.message}
          />
          <AuthInputField
            control={control}
            name="last_name"
            label="Nom"
            icon={<User size={16} color={theme.textMuted} />}
            placeholder="Ex. Dupont"
            error={errors.last_name?.message}
          />
          <AuthInputField
            control={control}
            name="phone"
            label="Téléphone"
            icon={<Phone size={16} color={theme.textMuted} />}
            placeholder="+33 6 00 00 00 00"
            keyboardType="phone-pad"
            error={errors.phone?.message}
          />
        </Animated.View>

        {/* Relation chips */}
        <Animated.View
          entering={FadeInDown.delay(160).duration(400)}
          style={{ marginBottom: 16 }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              color: theme.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: 1,
              marginBottom: 10,
            }}
          >
            Relation
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {RELATIONSHIPS.map(r => {
              const active = selectedRelationship === r;
              return (
                <TouchableOpacity
                  key={r}
                  onPress={() => handleRelationshipSelect(r)}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 14,
                    borderRadius: 12,
                    backgroundColor: active ? theme.accent : theme.card,
                    borderWidth: 1,
                    borderColor: active ? theme.accent : theme.cardBorder,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: active ? '#fff' : theme.textSecondary,
                    }}
                  >
                    {r}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {errors.relationship?.message ? (
            <Text style={{ color: theme.red, fontSize: 12, marginTop: 6 }}>
              {errors.relationship.message}
            </Text>
          ) : null}
        </Animated.View>
      </ScrollView>

      {/* CTA */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 16,
          paddingTop: 12,
          backgroundColor: theme.ctaBg,
          borderTopWidth: 1,
          borderTopColor: theme.ctaBorder,
        }}
      >
        <TouchableOpacity
          onPress={handleSubmit(onSubmit)}
          disabled={updateGuardian.isPending}
          style={{
            backgroundColor: theme.primary,
            borderRadius: 18,
            paddingVertical: 16,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
            opacity: updateGuardian.isPending ? 0.6 : 1,
          }}
        >
          <Check size={18} color="#fff" strokeWidth={2.5} />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
            {updateGuardian.isPending
              ? 'Enregistrement…'
              : 'Enregistrer les modifications'}
          </Text>
        </TouchableOpacity>
        {updateGuardian.isError ? (
          <Text
            style={{
              color: theme.red,
              fontSize: 13,
              textAlign: 'center',
              marginTop: 8,
            }}
          >
            Une erreur est survenue. Réessayez.
          </Text>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}
