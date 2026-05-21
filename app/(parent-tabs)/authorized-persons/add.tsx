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
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Clipboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { AuthInputField } from '@/features/auth/components/ui/AuthInputField';
import { PinAccessSection } from '@/features/parent/components/ui/PinAccessSection';
import { useSession } from '@/features/auth/store/auth.store';
import { supabase } from '@/lib/supabase/client';
import { Toast } from '@/shared/ui/molecules/Toast';

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
  relationship: z.string().min(1, 'Sélectionnez une relation'),
  email: z.string().email('Email invalide'),
  access_code: z.string().regex(/^\d{6}$/, '6 chiffres requis'),
});

type FormData = z.infer<typeof schema>;

interface CreatedGuardian {
  firstName: string;
  email: string;
  pin: string;
}

export default function AddGuardianScreen() {
  const router = useRouter();
  const tabBarHeight = useBottomTabBarHeight();
  const theme = useTheme();
  const session = useSession();
  const { childId } = useLocalSearchParams<{ childId: string }>();

  const [selectedRelationship, setSelectedRelationship] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedGuardian | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: '',
      last_name: '',
      phone: '',
      relationship: '',
      email: '',
      access_code: '',
    },
  });

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
      if (!childId || !session?.user.id) return;
      setIsSubmitting(true);
      setError(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      try {
        const { error: rpcError } = await supabase.rpc('invite_guardian', {
          p_child_id: childId,
          p_first_name: data.first_name,
          p_last_name: data.last_name,
          p_phone: data.phone?.trim() || null,
          p_relationship: data.relationship,
          p_access_code_hash: data.access_code,
          p_email: data.email.trim().toLowerCase(),
        });

        if (rpcError) throw new Error(rpcError.message);

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setCreated({
          firstName: data.first_name,
          email: data.email.trim().toLowerCase(),
          pin: data.access_code,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Une erreur est survenue.';
        setError(msg);
        Toast.show(msg, { type: 'error', duration: 4000 });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [childId, session]
  );

  const handleCopyPin = useCallback((pin: string) => {
    Clipboard.setString(pin);
    Toast.show('Code copié !', { type: 'success', duration: 2000 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // ── Success screen ────────────────────────────────────────────────────────
  if (created) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: theme.bg }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{
            padding: 24,
            paddingBottom: tabBarHeight + 40,
          }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.delay(80).duration(400)}>
            {/* Icone succès */}
            <View style={{ alignItems: 'center', marginBottom: 28 }}>
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 24,
                  backgroundColor: theme.accentBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <Ionicons
                  name="shield-checkmark"
                  size={36}
                  color={theme.accent}
                />
              </View>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: '800',
                  color: theme.text,
                  letterSpacing: -0.5,
                  textAlign: 'center',
                  marginBottom: 8,
                }}
              >
                {created.firstName} a été ajouté(e) !
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: theme.textSecondary,
                  textAlign: 'center',
                  lineHeight: 21,
                }}
              >
                Partagez ce code de connexion directement avec{' '}
                {created.firstName}.{'\n'}Il se connectera avec son email et ce
                code.
              </Text>
            </View>

            {/* Bloc email */}
            <View
              style={{
                backgroundColor: theme.card,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: theme.cardBorder,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: theme.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  marginBottom: 6,
                }}
              >
                Email de connexion
              </Text>
              <Text
                style={{ fontSize: 15, fontWeight: '600', color: theme.text }}
              >
                {created.email}
              </Text>
            </View>

            {/* Bloc PIN */}
            <View
              style={{
                backgroundColor: theme.accentBg,
                borderRadius: 16,
                borderWidth: 1.5,
                borderColor: theme.accent,
                padding: 20,
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: theme.accent,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  marginBottom: 12,
                }}
              >
                Code de connexion sécurisé
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Text
                  style={{
                    fontSize: 36,
                    fontWeight: '800',
                    color: theme.accent,
                    letterSpacing: 10,
                  }}
                >
                  {created.pin}
                </Text>
                <TouchableOpacity
                  onPress={() => handleCopyPin(created.pin)}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    backgroundColor: theme.accent,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="copy-outline" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Avertissement */}
            <View
              style={{
                backgroundColor: theme.amberBg,
                borderRadius: 12,
                padding: 14,
                marginBottom: 28,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  color: theme.textSecondary,
                  lineHeight: 20,
                }}
              >
                ⚠️ Partagez ce code{' '}
                <Text style={{ fontWeight: '700', color: theme.text }}>
                  en privé
                </Text>{' '}
                — par téléphone ou en personne. Ne l'envoyez pas par message.
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                backgroundColor: theme.accent,
                borderRadius: 18,
                paddingVertical: 16,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
                Terminé
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── Form screen ───────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingBottom: tabBarHeight + 120,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(80).duration(400)}>
          <AuthInputField
            control={control}
            name="first_name"
            label="Prénom"
            icon={
              <Ionicons
                name="person-outline"
                size={16}
                color={theme.textMuted}
              />
            }
            placeholder="Ex. Jean"
            error={errors.first_name?.message}
          />
          <AuthInputField
            control={control}
            name="last_name"
            label="Nom"
            icon={
              <Ionicons
                name="person-outline"
                size={16}
                color={theme.textMuted}
              />
            }
            placeholder="Ex. Dupont"
            error={errors.last_name?.message}
          />
          <AuthInputField
            control={control}
            name="email"
            label="Email"
            icon={
              <Ionicons name="mail-outline" size={16} color={theme.textMuted} />
            }
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
            icon={
              <Ionicons name="call-outline" size={16} color={theme.textMuted} />
            }
            placeholder="+33 6 00 00 00 00"
            keyboardType="phone-pad"
            error={errors.phone?.message}
          />
        </Animated.View>

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

        <Animated.View
          entering={FadeInDown.delay(220).duration(400)}
          style={{ marginBottom: 16 }}
        >
          <PinAccessSection
            control={control}
            name="access_code"
            error={errors.access_code?.message}
            enabled={true}
            onToggle={() => {}}
            hideToggle
          />
        </Animated.View>
      </ScrollView>

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
          disabled={isSubmitting}
          style={{
            backgroundColor: theme.accent,
            borderRadius: 18,
            paddingVertical: 16,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
            opacity: isSubmitting ? 0.6 : 1,
          }}
        >
          <Ionicons name="checkmark" size={18} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
            {isSubmitting ? 'Création…' : "Créer l'autorisation"}
          </Text>
        </TouchableOpacity>
        {error ? (
          <Text
            style={{
              color: theme.red,
              fontSize: 13,
              textAlign: 'center',
              marginTop: 8,
            }}
          >
            {error}
          </Text>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}
