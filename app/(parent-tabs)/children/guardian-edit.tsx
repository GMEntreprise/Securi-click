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
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
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
  Mail,
  Check,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react-native';
import { useTheme } from '@/theme';
import { AuthInputField } from '@/features/auth/components/ui/AuthInputField';
import { PinAccessSection } from '@/features/parent/components/ui/PinAccessSection';
import {
  useUpdateGuardian,
  useToggleGuardian,
  useDeleteGuardian,
} from '@/features/parent/hooks/useGuardians';
import { parentService } from '@/features/parent/services/parent.service';
import { supabase } from '@/lib/supabase/client';

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
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email('Email invalide'),
  relationship: z.string().min(1, 'Sélectionnez une relation'),
  access_code: z
    .string()
    .regex(/^\d{6}$/, '6 chiffres requis')
    .optional()
    .or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

export default function GuardianEditScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const theme = useTheme();
  const { guardianId, childId } = useLocalSearchParams<{
    guardianId: string;
    childId: string;
  }>();

  const { data: guardian, isLoading } = useQuery({
    queryKey: ['guardian', guardianId],
    queryFn: () => parentService.getGuardian(guardianId ?? ''),
    enabled: !!guardianId,
  });

  const updateGuardian = useUpdateGuardian(childId ?? '');
  const toggleGuardian = useToggleGuardian(childId ?? '');
  const deleteGuardian = useDeleteGuardian(childId ?? '');

  const [selectedRelationship, setSelectedRelationship] = useState('');
  const [usePinCode, setUsePinCode] = useState(false);

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
      email: '',
      relationship: '',
      access_code: '',
    },
  });

  useEffect(() => {
    if (guardian) {
      reset({
        first_name: guardian.first_name,
        last_name: guardian.last_name,
        phone: guardian.phone ?? '',
        email: guardian.email ?? '',
        relationship: guardian.relationship,
        access_code: '',
      });
      setSelectedRelationship(guardian.relationship);
      // PIN already set on this guardian → start with toggle on
      setUsePinCode(!!(guardian as any).access_code_hash);
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
      if (!guardianId) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      try {
        await updateGuardian.mutateAsync({
          guardianId,
          payload: {
            first_name: data.first_name,
            last_name: data.last_name,
            phone: data.phone?.trim() || null,
            email: data.email.trim(),
            relationship: data.relationship,
          },
        });

        // If a new PIN was entered, rehash it server-side
        if (usePinCode && data.access_code?.trim()) {
          const { error: rpcError } = await supabase.rpc('update_guardian_pin', {
            p_guardian_id: guardianId,
            p_access_code: data.access_code.trim(),
          });
          if (rpcError) throw new Error(rpcError.message);
        } else if (!usePinCode) {
          // PIN disabled → clear the hash
          const { error: rpcError } = await supabase.rpc('update_guardian_pin', {
            p_guardian_id: guardianId,
            p_access_code: null,
          });
          if (rpcError) throw new Error(rpcError.message);
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      } catch {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    },
    [guardianId, updateGuardian, usePinCode, router]
  );

  const handleToggle = useCallback(() => {
    if (!guardianId || !guardian) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleGuardian.mutate({ guardianId, isActive: !guardian.is_active });
  }, [guardianId, guardian, toggleGuardian]);

  const handleDelete = useCallback(() => {
    if (!guardianId || !guardian) return;
    Alert.alert(
      "Supprimer l'autorisation",
      `Retirer l'accès à ${guardian.first_name} ${guardian.last_name} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            deleteGuardian.mutate(guardianId);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
          },
        },
      ]
    );
  }, [guardianId, guardian, deleteGuardian, router]);

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

  const isSaving = updateGuardian.isPending;

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
            <Text style={{ color: theme.text, fontSize: 18, fontWeight: '800' }}>
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
              backgroundColor: guardian?.is_active ? theme.greenBg : theme.iconBg,
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
        contentContainerStyle={{ padding: 20, paddingBottom: tabBarHeight + 120 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Status banner */}
        {guardian && (
          <Animated.View
            entering={FadeInDown.delay(60).duration(300)}
            style={{
              backgroundColor: guardian.is_active ? theme.greenBg : theme.iconBg,
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
                backgroundColor: guardian.is_active ? theme.green : theme.textMuted,
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

        {/* Identity fields */}
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
            name="email"
            label="Email"
            icon={<Mail size={16} color={theme.textMuted} />}
            placeholder="collecteur@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.email?.message}
          />
          <AuthInputField
            control={control}
            name="phone"
            label="Téléphone (optionnel)"
            icon={<Phone size={16} color={theme.textMuted} />}
            placeholder="+33 6 00 00 00 00"
            keyboardType="phone-pad"
            error={errors.phone?.message}
          />
        </Animated.View>

        {/* Relation chips */}
        <Animated.View
          entering={FadeInDown.delay(160).duration(400)}
          style={{ marginBottom: 20 }}
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

        {/* PIN section */}
        <Animated.View
          entering={FadeInDown.delay(220).duration(400)}
          style={{ marginBottom: 16 }}
        >
          <PinAccessSection
            control={control}
            name="access_code"
            error={errors.access_code?.message}
            enabled={usePinCode}
            onToggle={v => {
              setUsePinCode(v);
              if (!v) setValue('access_code', '');
            }}
          />
        </Animated.View>
      </ScrollView>

      {/* CTA */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingBottom: tabBarHeight + 20,
          paddingTop: 14,
          backgroundColor: theme.ctaBg,
          borderTopWidth: 1,
          borderTopColor: theme.ctaBorder,
        }}
      >
        <TouchableOpacity
          onPress={handleSubmit(onSubmit)}
          disabled={isSaving}
          style={{
            backgroundColor: theme.primary,
            borderRadius: 18,
            paddingVertical: 16,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
            opacity: isSaving ? 0.6 : 1,
          }}
        >
          <Check size={18} color="#fff" strokeWidth={2.5} />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
            {isSaving ? 'Enregistrement…' : 'Enregistrer les modifications'}
          </Text>
        </TouchableOpacity>
        {updateGuardian.isError ? (
          <Text
            style={{ color: theme.red, fontSize: 13, textAlign: 'center', marginTop: 8 }}
          >
            Une erreur est survenue. Réessayez.
          </Text>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}
