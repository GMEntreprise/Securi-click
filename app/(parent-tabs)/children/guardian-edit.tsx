import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { AuthInputField } from '@/features/auth/components/ui/AuthInputField';
import { PinAccessSection } from '@/features/parent/components/ui/PinAccessSection';
import { PickupScheduleSheet } from '@/features/parent/components/ui/PickupScheduleSheet';
import { Toast } from '@/shared/ui/molecules/Toast';
import {
  useUpdateGuardian,
  useToggleGuardian,
  useDeleteGuardian,
} from '@/features/parent/hooks/useGuardians';
import { usePickupAuthorization } from '@/features/parent/hooks/usePickupAuthorization';
import {
  getActiveDayLabels,
  formatTimeWindows,
} from '@/features/collector/hooks/usePickupSchedule';
import { parentService } from '@/features/parent/services/parent.service';
import { supabase } from '@/lib/supabase/client';

const PRESET_RELATIONSHIPS = [
  'Grand-père',
  'Grand-mère',
  'Oncle',
  'Tante',
  'Frère',
  'Sœur',
  'Cousin(e)',
  'Nourrice',
  'Voisin',
  "Parent d'élève",
  'Autre',
];

const schema = z.object({
  first_name: z.string().min(2, 'Minimum 2 caractères'),
  last_name: z.string().min(2, 'Minimum 2 caractères'),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email('Email invalide'),
  relationship: z.string().min(1, 'Sélectionnez une relation'),
  // Empty = keep existing hash. 6 digits = replace. Anything else = error.
  access_code: z
    .string()
    .refine(v => v === '' || /^\d{6}$/.test(v), '6 chiffres requis'),
});

type FormData = z.infer<typeof schema>;

export default function GuardianEditScreen() {
  const router = useRouter();
  const navigation = useNavigation();
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

  const { data: pickupAuth } = usePickupAuthorization(
    childId ?? '',
    guardianId ?? ''
  );
  const [scheduleVisible, setScheduleVisible] = useState(false);

  const [selectedRelationship, setSelectedRelationship] = useState('');
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const customInputRef = useRef<TextInput>(null);

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
    }
  }, [guardian, reset]);

  const handleRelationshipSelect = useCallback(
    (rel: string) => {
      if (rel === 'Autre') {
        setCustomInput('');
        setCustomModalVisible(true);
        return;
      }
      setSelectedRelationship(rel);
      setValue('relationship', rel, { shouldValidate: true });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [setValue]
  );

  const handleCustomConfirm = useCallback(() => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    setSelectedRelationship(trimmed);
    setValue('relationship', trimmed, { shouldValidate: true });
    setCustomModalVisible(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [customInput, setValue]);

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

        // New PIN entered → rehash server-side. Empty = keep existing hash.
        if (data.access_code?.trim()) {
          const { error: rpcError } = await supabase.rpc(
            'update_guardian_pin',
            {
              p_guardian_id: guardianId,
              p_access_code: data.access_code.trim(),
            }
          );
          if (rpcError) throw new Error(rpcError.message);
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Toast.show('Autorisation mise à jour', {
          type: 'success',
          duration: 2500,
        });
        router.back();
      } catch {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Toast.show('Impossible de sauvegarder les modifications', {
          type: 'error',
          duration: 3000,
        });
      }
    },
    [guardianId, updateGuardian, router]
  );

  const handleToggle = useCallback(
    (nextValue: boolean) => {
      if (!guardianId || !guardian) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      toggleGuardian.mutate({ guardianId, isActive: nextValue });
    },
    [guardianId, guardian, toggleGuardian]
  );

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

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Switch
          value={guardian?.is_active ?? false}
          onValueChange={handleToggle}
          trackColor={{ false: theme.switchTrackOff, true: theme.green }}
          thumbColor="#ffffff"
          ios_backgroundColor={theme.switchTrackOff}
          style={{ marginRight: 4 }}
        />
      ),
    });
  }, [navigation, guardian, handleToggle, theme]);

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
    <>
      <PickupScheduleSheet
        visible={scheduleVisible}
        childId={childId ?? ''}
        guardianId={guardianId ?? ''}
        guardianName={
          guardian ? `${guardian.first_name} ${guardian.last_name}` : ''
        }
        onClose={() => setScheduleVisible(false)}
      />
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
          {/* Status banner */}
          {guardian && (
            <Animated.View
              entering={FadeInDown.delay(60).duration(300)}
              style={{
                backgroundColor: guardian.is_active
                  ? 'rgba(16,185,129,0.12)'
                  : 'rgba(239,68,68,0.10)',
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
                  backgroundColor: guardian.is_active ? theme.green : theme.red,
                }}
              />
              <Text
                style={{
                  color: guardian.is_active ? theme.green : theme.red,
                  fontWeight: '600',
                  fontSize: 13,
                }}
              >
                {guardian.is_active
                  ? "Accès actif — peut récupérer l'enfant"
                  : "Accès désactivé — ne peut pas récupérer l'enfant"}
              </Text>
            </Animated.View>
          )}

          {/* Identity fields */}
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
                <Ionicons
                  name="mail-outline"
                  size={16}
                  color={theme.textMuted}
                />
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
                <Ionicons
                  name="call-outline"
                  size={16}
                  color={theme.textMuted}
                />
              }
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
              {PRESET_RELATIONSHIPS.map(r => {
                const isCustomSelected =
                  !PRESET_RELATIONSHIPS.includes(selectedRelationship) &&
                  selectedRelationship !== '';
                const active =
                  r === 'Autre'
                    ? isCustomSelected || selectedRelationship === 'Autre'
                    : selectedRelationship === r;
                const label =
                  r === 'Autre' && isCustomSelected ? selectedRelationship : r;
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
                      {label}
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
              enabled={true}
              onToggle={() => {}}
              hideToggle
            />
          </Animated.View>

          {/* Planning de récupération */}
          <Animated.View
            entering={FadeInDown.delay(260).duration(400)}
            style={{ marginBottom: 24 }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: theme.textMuted,
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: 10,
              }}
            >
              Planning de récupération
            </Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setScheduleVisible(true);
              }}
              activeOpacity={0.8}
              style={{
                backgroundColor: theme.card,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: pickupAuth?.is_active
                  ? 'rgba(16,185,129,0.3)'
                  : theme.cardBorder,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: theme.accentBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={theme.accent}
                />
              </View>
              <View style={{ flex: 1 }}>
                {pickupAuth ? (
                  <>
                    <Text
                      style={{
                        color: theme.text,
                        fontWeight: '700',
                        fontSize: 14,
                      }}
                    >
                      {getActiveDayLabels(pickupAuth).join(', ') ||
                        'Aucun jour défini'}
                    </Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 5,
                        marginTop: 3,
                      }}
                    >
                      <Ionicons
                        name="time-outline"
                        size={11}
                        color={theme.textMuted}
                      />
                      <Text style={{ color: theme.textMuted, fontSize: 12 }}>
                        {formatTimeWindows(pickupAuth)}
                      </Text>
                    </View>
                  </>
                ) : (
                  <>
                    <Text
                      style={{
                        color: theme.text,
                        fontWeight: '700',
                        fontSize: 14,
                      }}
                    >
                      Définir le planning
                    </Text>
                    <Text
                      style={{
                        color: theme.textMuted,
                        fontSize: 12,
                        marginTop: 2,
                      }}
                    >
                      Jours et horaires de récupération
                    </Text>
                  </>
                )}
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={theme.textMuted}
              />
            </TouchableOpacity>
          </Animated.View>

          {/* Delete card */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: theme.textMuted,
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: 10,
              }}
            >
              Zone dangereuse
            </Text>
            <TouchableOpacity
              onPress={handleDelete}
              activeOpacity={0.8}
              style={{
                backgroundColor: theme.redBg,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: 'rgba(239,68,68,0.25)',
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: 'rgba(239,68,68,0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="trash-outline" size={18} color={theme.red} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ color: theme.red, fontWeight: '700', fontSize: 14 }}
                >
                  Supprimer l'autorisation
                </Text>
                <Text
                  style={{
                    color: theme.red,
                    fontSize: 12,
                    opacity: 0.7,
                    marginTop: 2,
                  }}
                >
                  Cette personne ne pourra plus récupérer l'enfant.
                </Text>
              </View>
            </TouchableOpacity>
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
            <Ionicons name="checkmark" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
              {isSaving ? 'Enregistrement…' : 'Enregistrer les modifications'}
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

      <Modal
        visible={customModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCustomModalVisible(false)}
        onShow={() => setTimeout(() => customInputRef.current?.focus(), 80)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          activeOpacity={1}
          onPress={() => setCustomModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            style={{
              width: '82%',
              backgroundColor: theme.card,
              borderRadius: 20,
              padding: 24,
              gap: 16,
            }}
          >
            <Text
              style={{ fontSize: 16, fontWeight: '700', color: theme.text }}
            >
              Autre relation
            </Text>
            <TextInput
              ref={customInputRef}
              value={customInput}
              onChangeText={setCustomInput}
              placeholder="Ex. Baby-sitter, Tuteur légal…"
              placeholderTextColor={theme.placeholder}
              returnKeyType="done"
              onSubmitEditing={handleCustomConfirm}
              style={{
                backgroundColor: theme.input,
                borderWidth: 1.5,
                borderColor: theme.inputBorder,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 15,
                color: theme.text,
              }}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setCustomModalVisible(false)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: theme.iconBg,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontWeight: '600',
                    color: theme.textSecondary,
                    fontSize: 14,
                  }}
                >
                  Annuler
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCustomConfirm}
                disabled={!customInput.trim()}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: theme.accent,
                  alignItems: 'center',
                  opacity: customInput.trim() ? 1 : 0.4,
                }}
              >
                <Text
                  style={{ fontWeight: '700', color: '#fff', fontSize: 14 }}
                >
                  Confirmer
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
