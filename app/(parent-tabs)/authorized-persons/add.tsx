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
import { useBottomTabBarHeight } from 'expo-router/js-tabs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Clipboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { message } from '@/i18n/validation';
import { AuthInputField } from '@/features/auth/components/ui/AuthInputField';
import { PinAccessSection } from '@/features/parent/components/ui/PinAccessSection';
import { useSession } from '@/features/auth/store/auth.store';
import { parentService } from '@/features/parent/services/parent.service';
import { Toast } from '@/shared/ui/molecules/Toast';

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
  relationship: z.string().min(1, message('errors:relationship_required')),
  email: z.string().email(message('errors:email_invalid')),
  access_code: z.string().regex(/^\d{6}$/, message('errors:pin_6_digits')),
});

type FormData = z.infer<typeof schema>;

interface CreatedGuardian {
  firstName: string;
  email: string;
  pin: string;
}

export default function AddGuardianScreen() {
  const router = useRouter();
  const { t } = useTranslation('parent');
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
        const { error: rpcError } = await parentService.inviteGuardian({
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
        const msg = e instanceof Error ? e.message : t('errors:generic');
        setError(msg);
        Toast.show(msg, { type: 'error', duration: 4000 });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [childId, session, t]
  );

  const handleCopyPin = useCallback(
    (pin: string) => {
      Clipboard.setString(pin);
      Toast.show(t('ap_code_copied'), { type: 'success', duration: 2000 });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [t]
  );

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
                {t('ap_added', { name: created.firstName })}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: theme.textSecondary,
                  textAlign: 'center',
                  lineHeight: 21,
                }}
              >
                {t('ap_share_intro', { name: created.firstName })}
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
                {t('ap_login_email')}
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
                {t('ap_secure_code')}
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
                {t('ap_share_pre')}{' '}
                <Text style={{ fontWeight: '700', color: theme.text }}>
                  {t('ap_share_bold')}
                </Text>{' '}
                {t('ap_share_post')}
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
                {t('ap_done')}
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
          onPress={() => {
            handleSubmit(onSubmit)();
          }}
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
            {isSubmitting ? t('ap_creating') : t('ap_create')}
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
