import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  User,
  Phone,
  Heart,
  Calendar,
  Check,
  FileText,
} from 'lucide-react-native';
import { useTheme } from '@/theme';
import { AuthInputField } from '@/features/auth/components/ui/AuthInputField';
import { useAddAuthorizedPerson } from '@/features/parent/hooks/useAuthorizedPersons';

const RELATIONS = [
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
  relation: z.string().min(1, 'Sélectionnez une relation'),
  valid_until: z.string().nullable(),
  notes: z.string().nullable(),
});

type FormData = z.infer<typeof schema>;

export default function AddAuthorizedPersonScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const addPerson = useAddAuthorizedPerson();

  const [selectedRelation, setSelectedRelation] = useState('');

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: '',
      last_name: '',
      phone: '',
      relation: '',
      valid_until: null,
      notes: null,
    },
  });

  const handleRelationSelect = useCallback(
    (relation: string) => {
      setSelectedRelation(relation);
      setValue('relation', relation, { shouldValidate: true });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [setValue]
  );

  const onSubmit = useCallback(
    async (data: FormData) => {
      if (!childId) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await addPerson.mutateAsync({
        child_id: childId,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        relation: data.relation,
        valid_until: data.valid_until,
        notes: data.notes,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    },
    [childId, addPerson, router]
  );

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
          gap: 14,
        }}
      >
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
            Nouvelle autorisation
          </Text>
          <Text
            style={{
              color: theme.text,
              fontSize: 20,
              fontWeight: '800',
              letterSpacing: -0.3,
            }}
          >
            Ajouter une personne
          </Text>
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
            {RELATIONS.map(r => {
              const active = selectedRelation === r;
              return (
                <TouchableOpacity
                  key={r}
                  onPress={() => handleRelationSelect(r)}
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
          {errors.relation?.message ? (
            <Text style={{ color: theme.red, fontSize: 12, marginTop: 6 }}>
              {errors.relation.message}
            </Text>
          ) : null}
        </Animated.View>

        {/* Optional fields */}
        <Animated.View entering={FadeInDown.delay(240).duration(400)}>
          <AuthInputField
            control={control}
            name="valid_until"
            label="Valide jusqu'au (optionnel)"
            icon={<Calendar size={16} color={theme.textMuted} />}
            placeholder="AAAA-MM-JJ"
            error={errors.valid_until?.message ?? undefined}
          />
          <AuthInputField
            control={control}
            name="notes"
            label="Notes (optionnel)"
            icon={<FileText size={16} color={theme.textMuted} />}
            placeholder="Ex. récupère les mercredis"
            multiline
            error={errors.notes?.message ?? undefined}
          />
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
          disabled={addPerson.isPending}
          style={{
            backgroundColor: theme.accent,
            borderRadius: 18,
            paddingVertical: 16,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
            opacity: addPerson.isPending ? 0.6 : 1,
          }}
        >
          <Check size={18} color="#fff" strokeWidth={2.5} />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
            {addPerson.isPending ? 'Enregistrement…' : 'Ajouter la personne'}
          </Text>
        </TouchableOpacity>
        {addPerson.isError ? (
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
