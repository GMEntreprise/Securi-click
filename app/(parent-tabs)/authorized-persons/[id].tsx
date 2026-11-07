import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useBottomTabBarHeight } from 'expo-router/js-tabs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { message } from '@/i18n/validation';
import { AuthInputField } from '@/features/auth/components/ui/AuthInputField';
import { PinAccessSection } from '@/features/parent/components/ui/PinAccessSection';
import {
  useUpdateGuardian,
  useToggleGuardian,
  useDeleteGuardian,
} from '@/features/parent/hooks/useGuardians';
import { parentService } from '@/features/parent/services/parent.service';

const RELATIONSHIP_KEYS = [
  'guardian_rel_grandfather',
  'guardian_rel_grandmother',
  'guardian_rel_uncle',
  'guardian_rel_aunt',
  'guardian_rel_brother',
  'guardian_rel_sister',
  'guardian_rel_cousin',
  'guardian_rel_nanny',
  'guardian_rel_other',
] as const;

const schema = z.object({
  first_name: z.string().min(2, message('errors:min_2_chars')),
  last_name: z.string().min(2, message('errors:min_2_chars')),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email(message('errors:email_invalid')),
  relationship: z.string().min(1, message('errors:relationship_required')),
  access_code: z
    .string()
    .regex(/^\d{6}$/, message('errors:pin_6_digits'))
    .optional()
    .or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

export default function GuardianDetailScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const tabBarHeight = useBottomTabBarHeight();
  const theme = useTheme();
  const { t } = useTranslation('parent');
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
      if (!id) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      try {
        await updateGuardian.mutateAsync({
          guardianId: id,
          payload: {
            first_name: data.first_name,
            last_name: data.last_name,
            phone: data.phone?.trim() || null,
            email: data.email.trim(),
            relationship: data.relationship,
          },
        });

        if (usePinCode && data.access_code?.trim()) {
          const { error: rpcError } = await parentService.updateGuardianPin(
            id,
            data.access_code.trim()
          );
          if (rpcError) throw new Error(rpcError.message);
        } else if (!usePinCode) {
          const { error: rpcError } = await parentService.updateGuardianPin(
            id,
            null
          );
          if (rpcError) throw new Error(rpcError.message);
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      } catch {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    },
    [id, updateGuardian, usePinCode, router]
  );

  const handleToggle = useCallback(
    (nextValue: boolean) => {
      if (!id || !guardian) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      toggleGuardian.mutate({ guardianId: id, isActive: nextValue });
    },
    [id, guardian, toggleGuardian]
  );

  const handleDelete = useCallback(() => {
    if (!id || !guardian) return;
    Alert.alert(
      t('ap_delete_title'),
      t('ap_delete_body', {
        name: `${guardian.first_name} ${guardian.last_name}`,
      }),
      [
        { text: t('common:cancel'), style: 'cancel' },
        {
          text: t('common:delete'),
          style: 'destructive',
          onPress: () => {
            deleteGuardian.mutate(id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
          },
        },
      ]
    );
  }, [id, guardian, deleteGuardian, router, t]);

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
              {guardian.is_active ? t('ap_active_hint') : t('ap_inactive_hint')}
            </Text>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(80).duration(400)}>
          <AuthInputField
            control={control}
            name="first_name"
            label={t('common:first_name')}
            icon={
              <Ionicons
                name="person-outline"
                size={16}
                color={theme.textMuted}
              />
            }
            placeholder={t('ap_first_name_placeholder')}
            error={errors.first_name?.message}
          />
          <AuthInputField
            control={control}
            name="last_name"
            label={t('common:last_name')}
            icon={
              <Ionicons
                name="person-outline"
                size={16}
                color={theme.textMuted}
              />
            }
            placeholder={t('ap_last_name_placeholder')}
            error={errors.last_name?.message}
          />
          <AuthInputField
            control={control}
            name="email"
            label={t('common:email')}
            icon={
              <Ionicons name="mail-outline" size={16} color={theme.textMuted} />
            }
            placeholder={t('ap_email_placeholder')}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.email?.message}
          />
          <AuthInputField
            control={control}
            name="phone"
            label={t('ap_phone_optional')}
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
            {t('ap_relationship')}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {RELATIONSHIP_KEYS.map(key => {
              const r = t(key);
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
            enabled={usePinCode}
            onToggle={v => {
              setUsePinCode(v);
              if (!v) setValue('access_code', '');
            }}
          />
        </Animated.View>

        {/* Delete card */}
        <Animated.View entering={FadeInDown.delay(280).duration(400)}>
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
            {t('ap_danger_zone')}
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
                {t('ap_delete_title')}
              </Text>
              <Text
                style={{
                  color: theme.red,
                  fontSize: 12,
                  opacity: 0.7,
                  marginTop: 2,
                }}
              >
                {t('ap_delete_hint')}
              </Text>
            </View>
          </TouchableOpacity>
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
          onPress={() => {
            handleSubmit(onSubmit)();
          }}
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
            {isSaving ? t('ap_saving') : t('ap_save')}
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
            {t('errors:generic')}
          </Text>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}
