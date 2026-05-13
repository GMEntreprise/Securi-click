import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
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
  Lock,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react-native';
import { useTheme } from '@/theme';
import { AuthInputField } from '@/features/auth/components/ui/AuthInputField';
import { useSession } from '@/features/auth/store/auth.store';
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
  phone: z.string().min(10, 'Numéro invalide'),
  relationship: z.string().min(1, 'Sélectionnez une relation'),
  access_code: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function AddGuardianScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const theme = useTheme();
  const session = useSession();
  const { childId } = useLocalSearchParams<{ childId: string }>();

  const [selectedRelationship, setSelectedRelationship] = useState('');
  const [useAccessCode, setUseAccessCode] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      relationship: '',
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
        const accessCodeHash =
          useAccessCode && data.access_code?.trim()
            ? data.access_code.trim()
            : null;

        const { error: rpcError } = await supabase.rpc('invite_guardian', {
          p_child_id: childId,
          p_first_name: data.first_name,
          p_last_name: data.last_name,
          p_phone: data.phone,
          p_relationship: data.relationship,
          p_access_code_hash: accessCodeHash,
        });

        if (rpcError) throw new Error(rpcError.message);

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Une erreur est survenue.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [childId, session, useAccessCode, router]
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

        {/* Access code toggle */}
        <Animated.View
          entering={FadeInDown.delay(220).duration(400)}
          style={{ marginBottom: 16 }}
        >
          <View
            style={{
              backgroundColor: theme.card,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: theme.cardBorder,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  backgroundColor: useAccessCode
                    ? theme.accentBg
                    : theme.iconBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Lock
                  size={17}
                  color={useAccessCode ? theme.accent : theme.textMuted}
                  strokeWidth={2.5}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}
                >
                  Code d'accès
                </Text>
                <Text
                  style={{ color: theme.textMuted, fontSize: 12, marginTop: 1 }}
                >
                  Le collecteur devra entrer ce code pour accepter l'invitation
                </Text>
              </View>
              <Switch
                value={useAccessCode}
                onValueChange={v => {
                  setUseAccessCode(v);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                trackColor={{ false: theme.switchTrackOff, true: theme.accent }}
                thumbColor="#fff"
              />
            </View>

            {useAccessCode && (
              <View
                style={{
                  borderTopWidth: 1,
                  borderTopColor: theme.separator,
                  padding: 16,
                }}
              >
                <Text
                  style={{
                    color: theme.textMuted,
                    fontSize: 11,
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    marginBottom: 8,
                  }}
                >
                  Votre code d'accès
                </Text>
                <AuthInputField
                  control={control}
                  name="access_code"
                  label=""
                  icon={<Lock size={16} color={theme.textMuted} />}
                  placeholder="Ex. 1234 ou un mot"
                  secureTextEntry={!showCode}
                  error={errors.access_code?.message}
                  rightElement={
                    <TouchableOpacity onPress={() => setShowCode(v => !v)}>
                      {showCode ? (
                        <EyeOff size={16} color={theme.textMuted} />
                      ) : (
                        <Eye size={16} color={theme.textMuted} />
                      )}
                    </TouchableOpacity>
                  }
                />
                <Text
                  style={{ color: theme.textMuted, fontSize: 11, marginTop: 4 }}
                >
                  Partagez ce code directement avec la personne autorisée.
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
      </ScrollView>

      {/* CTA */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingBottom: tabBarHeight + 8,
          paddingTop: 12,
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
          <Check size={18} color="#fff" strokeWidth={2.5} />
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
