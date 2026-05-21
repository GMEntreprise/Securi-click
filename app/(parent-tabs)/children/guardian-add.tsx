import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { User, Phone, Mail, Check } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthInputField } from '@/features/auth/components/ui/AuthInputField';
import { PinAccessSection } from '@/features/parent/components/ui/PinAccessSection';
import { useSession } from '@/features/auth/store/auth.store';
import { supabase } from '@/lib/supabase/client';
import { authService } from '@/features/auth/services/supabaseAuth.service';
import { Toast } from '@/shared/ui/molecules/Toast';
import { Avatar } from '@/shared/ui/base/avatar';
import {
  useExistingCollectors,
  useGuardians,
  useLinkCollector,
} from '@/features/parent/hooks/useGuardians';
import type { Guardian } from '@/features/parent/types';

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
  relationship: z.string().min(1, 'Sélectionnez une relation'),
  email: z.string().email('Email invalide'),
  access_code: z.string().regex(/^\d{6}$/, '6 chiffres requis'),
});

type FormData = z.infer<typeof schema>;

// ── Existing collector card ───────────────────────────────────────────────────

function ExistingCollectorCard({
  item,
  selected,
  onPress,
}: {
  item: Guardian;
  selected: boolean;
  onPress: (item: Guardian) => void;
}) {
  const theme = useTheme();
  return (
    <TouchableOpacity
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress(item);
      }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: theme.card,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: selected ? theme.accent : theme.cardBorder,
        padding: 14,
        marginBottom: 10,
      }}
    >
      <Avatar
        image={{ uri: '', name: `${item.first_name} ${item.last_name}` }}
        size={44}
        showBorder={false}
        backgroundColor={selected ? theme.accentBg : theme.iconBg}
        textColor={selected ? theme.accent : theme.textMuted}
      />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Text style={{ color: theme.text, fontSize: 15, fontWeight: '700' }}>
            {item.first_name} {item.last_name}
          </Text>
          {!item.collector_user_id && (
            <View style={{ backgroundColor: theme.amberBg, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
              <Text style={{ color: theme.amber, fontSize: 10, fontWeight: '700' }}>En attente</Text>
            </View>
          )}
        </View>
        <Text style={{ color: theme.textMuted, fontSize: 13, marginTop: 2 }}>
          {item.relationship}
          {item.phone ? ` · ${item.phone}` : ''}
        </Text>
      </View>
      {selected && (
        <MaterialCommunityIcons name="check-circle" size={22} color={theme.accent} />
      )}
    </TouchableOpacity>
  );
}

// ── Relation picker (shared between modes) ────────────────────────────────────

function RelationshipPicker({
  selected,
  onSelect,
  error,
}: {
  selected: string;
  onSelect: (rel: string) => void;
  error?: string;
}) {
  const theme = useTheme();
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const customInputRef = useRef<TextInput>(null);

  const isCustom =
    selected !== '' && !PRESET_RELATIONSHIPS.includes(selected);

  const handlePress = useCallback(
    (rel: string) => {
      if (rel === 'Autre') {
        setCustomInput('');
        setCustomModalVisible(true);
        return;
      }
      onSelect(rel);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [onSelect]
  );

  const handleCustomConfirm = useCallback(() => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    onSelect(trimmed);
    setCustomModalVisible(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [customInput, onSelect]);

  return (
    <>
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
          const active =
            r === 'Autre'
              ? isCustom || selected === 'Autre'
              : selected === r;
          const label = r === 'Autre' && isCustom ? selected : r;
          return (
            <TouchableOpacity
              key={r}
              onPress={() => handlePress(r)}
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
      {error ? (
        <Text style={{ color: theme.red, fontSize: 12, marginTop: 6 }}>
          {error}
        </Text>
      ) : null}

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
            <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>
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
                <Text style={{ fontWeight: '600', color: theme.textSecondary, fontSize: 14 }}>
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
                <Text style={{ fontWeight: '700', color: '#fff', fontSize: 14 }}>
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

// ── Main screen ───────────────────────────────────────────────────────────────

export default function AddGuardianScreen() {
  const router = useRouter();
  const tabBarHeight = useBottomTabBarHeight();
  const theme = useTheme();
  const session = useSession();
  const { childId } = useLocalSearchParams<{ childId: string }>();

  const [mode, setMode] = useState<'new' | 'existing'>('new');
  const [selectedCollector, setSelectedCollector] = useState<Guardian | null>(null);
  const [linkRelationship, setLinkRelationship] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: existingCollectors, isLoading: loadingCollectors } =
    useExistingCollectors();
  const { data: childGuardians } = useGuardians(childId ?? '');
  const linkCollector = useLinkCollector(childId ?? '');

  // Filter out collectors already linked to this specific child (by collector_user_id)
  const alreadyLinkedIds = new Set(
    (childGuardians ?? [])
      .map(g => g.collector_user_id)
      .filter(Boolean) as string[]
  );
  const availableCollectors = (existingCollectors ?? []).filter(
    c => c.collector_user_id != null && !alreadyLinkedIds.has(c.collector_user_id)
  );

  // ── New collector form ────────────────────────────────────────────────────

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

  const [selectedRelationship, setSelectedRelationship] = useState('');

  const handleRelationshipSelect = useCallback(
    (rel: string) => {
      setSelectedRelationship(rel);
      setValue('relationship', rel, { shouldValidate: true });
    },
    [setValue]
  );

  const onSubmitNew = useCallback(
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
          p_email: data.email.trim(),
        });

        if (rpcError) throw new Error(rpcError.message);

        try {
          await authService.inviteCollector(data.email.trim());
        } catch {
          // Rate limit hit — invitation enregistrée, email renvoyé plus tard
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Toast.show(`${data.first_name} ${data.last_name} a été ajouté(e)`, {
          type: 'success',
          duration: 3000,
        });
        router.back();
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Une erreur est survenue.';
        setError(msg);
        Toast.show(msg, { type: 'error', duration: 4000 });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [childId, session, router]
  );

  // ── Link existing collector ───────────────────────────────────────────────

  const handleLinkExisting = useCallback(async () => {
    if (!selectedCollector) return;
    if (!linkRelationship) {
      Toast.show('Veuillez sélectionner une relation', { type: 'error' });
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSubmitting(true);
    setError(null);

    try {
      await linkCollector.mutateAsync({
        collector_user_id: selectedCollector.collector_user_id ?? null,
        access_code_hash: selectedCollector.access_code_hash ?? null,
        first_name: selectedCollector.first_name,
        last_name: selectedCollector.last_name,
        phone: selectedCollector.phone,
        email: selectedCollector.email,
        relationship: linkRelationship,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show(
        `${selectedCollector.first_name} peut désormais récupérer cet enfant`,
        { type: 'success', duration: 3000 }
      );
      router.back();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Une erreur est survenue.';
      setError(msg);
      Toast.show(msg, { type: 'error', duration: 4000 });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedCollector, linkRelationship, linkCollector, router]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Mode tabs */}
      <Animated.View
        entering={FadeInDown.duration(300)}
        style={{
          flexDirection: 'row',
          marginHorizontal: 20,
          marginTop: 16,
          marginBottom: 4,
          backgroundColor: theme.iconBg,
          borderRadius: 14,
          padding: 4,
        }}
      >
        <TouchableOpacity
          onPress={() => {
            setMode('new');
            setError(null);
          }}
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 11,
            alignItems: 'center',
            backgroundColor: mode === 'new' ? theme.card : 'transparent',
            shadowColor: mode === 'new' ? '#000' : 'transparent',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: mode === 'new' ? 0.08 : 0,
            shadowRadius: 2,
            elevation: mode === 'new' ? 2 : 0,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: '700',
              color: mode === 'new' ? theme.text : theme.textMuted,
            }}
          >
            Nouveau collecteur
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setMode('existing');
            setError(null);
          }}
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 11,
            alignItems: 'center',
            backgroundColor: mode === 'existing' ? theme.card : 'transparent',
            shadowColor: mode === 'existing' ? '#000' : 'transparent',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: mode === 'existing' ? 0.08 : 0,
            shadowRadius: 2,
            elevation: mode === 'existing' ? 2 : 0,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: '700',
              color: mode === 'existing' ? theme.text : theme.textMuted,
            }}
          >
            Collecteur existant
          </Text>
          {availableCollectors.length > 0 && (
            <View
              style={{
                position: 'absolute',
                top: 6,
                right: 12,
                width: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: theme.accent,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>
                {availableCollectors.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* ── NEW MODE ─────────────────────────────────────────────────────── */}
      {mode === 'new' ? (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: tabBarHeight + 120 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.delay(60).duration(400)}>
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

          <Animated.View
            entering={FadeInDown.delay(160).duration(400)}
            style={{ marginBottom: 20 }}
          >
            <RelationshipPicker
              selected={selectedRelationship}
              onSelect={handleRelationshipSelect}
              error={errors.relationship?.message}
            />
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
      ) : (
        /* ── EXISTING MODE ─────────────────────────────────────────────── */
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: tabBarHeight + 120 }}
          showsVerticalScrollIndicator={false}
        >
          {loadingCollectors ? (
            <View style={{ alignItems: 'center', paddingTop: 40 }}>
              <ActivityIndicator color={theme.accent} />
            </View>
          ) : availableCollectors.length === 0 ? (
            <Animated.View
              entering={FadeInDown.delay(60).duration(400)}
              style={{
                backgroundColor: theme.card,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: theme.cardBorder,
                padding: 28,
                alignItems: 'center',
                gap: 12,
                marginTop: 8,
              }}
            >
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 20,
                  backgroundColor: theme.primaryBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MaterialCommunityIcons
                  name="shield-account-outline"
                  size={30}
                  color={theme.primary}
                />
              </View>
              <Text
                style={{
                  color: theme.text,
                  fontSize: 16,
                  fontWeight: '700',
                  textAlign: 'center',
                }}
              >
                Aucun collecteur existant
              </Text>
              <Text
                style={{
                  color: theme.textMuted,
                  fontSize: 13,
                  textAlign: 'center',
                  lineHeight: 19,
                }}
              >
                Créez d'abord un collecteur avec l'onglet "Nouveau collecteur", puis vous pourrez l'attribuer à d'autres enfants.
              </Text>
              <TouchableOpacity
                onPress={() => setMode('new')}
                style={{
                  backgroundColor: theme.accent,
                  borderRadius: 12,
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>
                  Créer un collecteur
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInDown.delay(60).duration(400)}>
              {/* Info banner */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: 10,
                  backgroundColor: theme.primaryBg,
                  borderRadius: 14,
                  padding: 14,
                  marginBottom: 16,
                }}
              >
                <MaterialCommunityIcons
                  name="information-outline"
                  size={18}
                  color={theme.primary}
                  style={{ marginTop: 1 }}
                />
                <Text style={{ flex: 1, color: theme.primary, fontSize: 13, lineHeight: 18 }}>
                  Ce collecteur gardera son code PIN existant. Sélectionnez-le et choisissez sa relation avec cet enfant.
                </Text>
              </View>

              {/* Collector list */}
              {availableCollectors.map(c => (
                <ExistingCollectorCard
                  key={c.id}
                  item={c}
                  selected={selectedCollector?.collector_user_id === c.collector_user_id}
                  onPress={setSelectedCollector}
                />
              ))}

              {/* Relationship for the link */}
              {selectedCollector && (
                <Animated.View
                  entering={FadeInDown.duration(300)}
                  style={{ marginTop: 12 }}
                >
                  <RelationshipPicker
                    selected={linkRelationship}
                    onSelect={setLinkRelationship}
                  />
                </Animated.View>
              )}
            </Animated.View>
          )}
        </ScrollView>
      )}

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
          onPress={
            mode === 'new'
              ? handleSubmit(onSubmitNew)
              : handleLinkExisting
          }
          disabled={
            isSubmitting ||
            (mode === 'existing' && (!selectedCollector || !linkRelationship))
          }
          style={{
            backgroundColor: theme.accent,
            borderRadius: 18,
            paddingVertical: 16,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
            opacity:
              isSubmitting ||
              (mode === 'existing' && (!selectedCollector || !linkRelationship))
                ? 0.5
                : 1,
          }}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Check size={18} color="#fff" strokeWidth={2.5} />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
                {mode === 'new' ? "Créer l'autorisation" : 'Attribuer ce collecteur'}
              </Text>
            </>
          )}
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
