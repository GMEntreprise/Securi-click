import React, { memo, useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  AlertCircle,
  Briefcase,
  Building2,
  Check,
  ChevronDown,
  MapPin,
  Phone,
  School,
  User,
  X,
} from 'lucide-react-native';
import { useTheme } from '@/theme';
import { useUpdateSchool } from '../../hooks/useSchool';
import { Toast } from '@/shared/ui/molecules/Toast';
import type { SchoolProfile } from '../../types';

const MANAGER_FUNCTIONS = [
  'Directeur / Directrice',
  'Directeur adjoint',
  'Principal',
  'Principal adjoint',
  'Enseignant',
  'Enseignant référent',
  'Responsable administratif',
  'Autre',
];

const SCHOOL_TYPES = [
  'École maternelle privée',
  'École maternelle publique',
  'École primaire privée',
  'École primaire publique',
];

interface EditSchoolSheetProps {
  school: SchoolProfile;
  onClose: () => void;
}

interface FormState {
  name: string;
  type: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  manager_first_name: string;
  manager_last_name: string;
  manager_function: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  keyboardType,
  autoCapitalize = 'sentences',
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  error?: string;
  keyboardType?: 'default' | 'phone-pad' | 'email-address' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words';
}) {
  const theme = useTheme();
  return (
    <View style={{ marginBottom: 14 }}>
      <Text
        style={{
          color: theme.textSecondary,
          fontSize: 13,
          fontWeight: '600',
          marginBottom: 6,
        }}
      >
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.placeholder}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize={autoCapitalize}
        style={{
          backgroundColor: theme.input,
          borderWidth: 1,
          borderColor: error ? theme.red : theme.inputBorder,
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 15,
          color: theme.text,
        }}
      />
      {error ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            marginTop: 4,
          }}
        >
          <AlertCircle size={13} color={theme.red} />
          <Text style={{ color: theme.red, fontSize: 12 }}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

export const EditSchoolSheet = memo(function EditSchoolSheet({
  school,
  onClose,
}: EditSchoolSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const updateSchool = useUpdateSchool();

  const [form, setForm] = useState<FormState>({
    name: school.name,
    type: school.type,
    phone: school.phone,
    address: school.address,
    city: school.city,
    postal_code: school.postal_code,
    manager_first_name: school.manager_first_name,
    manager_last_name: school.manager_last_name,
    manager_function: school.manager_function,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [functionPickerOpen, setFunctionPickerOpen] = useState(false);
  const [typePickerOpen, setTypePickerOpen] = useState(false);

  const setField = useCallback(
    (field: keyof FormState) => (value: string) => {
      setForm(prev => ({ ...prev, [field]: value }));
      setErrors(prev => ({ ...prev, [field]: undefined }));
    },
    []
  );

  const validate = useCallback((): boolean => {
    const next: FormErrors = {};
    if (!form.name.trim()) next.name = 'Nom requis';
    if (!form.phone.trim()) next.phone = 'Téléphone requis';
    if (!form.address.trim()) next.address = 'Adresse requise';
    if (!form.city.trim()) next.city = 'Ville requise';
    if (!form.postal_code.trim() || form.postal_code.trim().length < 5)
      next.postal_code = 'Code postal invalide';
    if (!form.manager_first_name.trim())
      next.manager_first_name = 'Prénom requis';
    if (!form.manager_last_name.trim()) next.manager_last_name = 'Nom requis';
    if (!form.manager_function.trim())
      next.manager_function = 'Fonction requise';
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [form]);

  const handleSave = useCallback(async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await updateSchool.mutateAsync({
        schoolId: school.id,
        payload: {
          name: form.name.trim(),
          type: form.type.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
          postal_code: form.postal_code.trim(),
          manager_first_name: form.manager_first_name.trim(),
          manager_last_name: form.manager_last_name.trim(),
          manager_function: form.manager_function.trim(),
        },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show('Établissement mis à jour', { type: 'success', duration: 2500 });
      onClose();
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show('Impossible d\'enregistrer les modifications', { type: 'error', duration: 3000 });
    }
  }, [validate, updateSchool, school.id, form, onClose]);

  const isBusy = updateSchool.isPending;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* Handle */}
      <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
        <View
          style={{
            width: 40,
            height: 4,
            borderRadius: 2,
            backgroundColor: theme.inputBorder,
          }}
        />
      </View>

      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 12,
        }}
      >
        <Text style={{ color: theme.text, fontSize: 20, fontWeight: '800' }}>
          Modifier l'établissement
        </Text>
        <TouchableOpacity
          onPress={onClose}
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            backgroundColor: theme.iconBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={18} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 40,
            gap: 16,
          }}
        >
          {/* Établissement */}
          <Animated.View
            entering={FadeInDown.duration(300)}
            style={{
              backgroundColor: theme.card,
              borderRadius: 22,
              borderWidth: 1,
              borderColor: theme.cardBorder,
              padding: 16,
            }}
          >
            <SectionHeader
              icon={<Building2 size={14} color={theme.accent} />}
              label="Établissement"
              bg={theme.accentBg}
            />
            <InputField
              label="Nom"
              value={form.name}
              onChangeText={setField('name')}
              placeholder="École du Centre"
              error={errors.name}
            />

            {/* Type picker */}
            <View style={{ marginBottom: 14 }}>
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: 13,
                  fontWeight: '600',
                  marginBottom: 6,
                }}
              >
                Type d'établissement
              </Text>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setTypePickerOpen(true);
                }}
                activeOpacity={0.75}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: theme.input,
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  paddingVertical: 14,
                  borderWidth: 1,
                  borderColor: form.type ? theme.accent : theme.inputBorder,
                }}
              >
                <School size={16} color={theme.textMuted} style={{ marginRight: 10 }} />
                <Text
                  style={{
                    flex: 1,
                    fontSize: 15,
                    color: form.type ? theme.text : theme.placeholder,
                  }}
                  numberOfLines={1}
                >
                  {form.type || 'Sélectionnez le type'}
                </Text>
                <ChevronDown
                  size={16}
                  color={form.type ? theme.accent : theme.textMuted}
                  strokeWidth={2.5}
                />
              </TouchableOpacity>
            </View>

            <Modal
              visible={typePickerOpen}
              transparent
              animationType="slide"
              onRequestClose={() => setTypePickerOpen(false)}
            >
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }}
                activeOpacity={1}
                onPress={() => setTypePickerOpen(false)}
              />
              <View
                style={{
                  backgroundColor: theme.card,
                  borderTopLeftRadius: 28,
                  borderTopRightRadius: 28,
                  paddingTop: 12,
                  paddingBottom: insets.bottom + 24,
                }}
              >
                <View style={{ alignItems: 'center', marginBottom: 16 }}>
                  <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: theme.inputBorder }} />
                </View>
                <Text style={{ fontSize: 17, fontWeight: '800', color: theme.text, paddingHorizontal: 20, marginBottom: 12, letterSpacing: -0.3 }}>
                  Type d'établissement
                </Text>
                <ScrollView showsVerticalScrollIndicator={false} bounces={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 6, paddingBottom: 8 }}>
                  {SCHOOL_TYPES.map(opt => {
                    const selected = form.type === opt;
                    return (
                      <TouchableOpacity
                        key={opt}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setField('type')(opt);
                          setTypePickerOpen(false);
                        }}
                        activeOpacity={0.75}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 14,
                          paddingHorizontal: 16,
                          borderRadius: 16,
                          borderWidth: 1.5,
                          borderColor: selected ? theme.accent : theme.cardBorder,
                          backgroundColor: selected
                            ? (theme.isDark ? 'rgba(249,115,22,0.12)' : 'rgba(249,115,22,0.08)')
                            : theme.bg,
                        }}
                      >
                        <Text style={{ flex: 1, fontSize: 15, fontWeight: selected ? '700' : '500', color: selected ? theme.accent : theme.text }}>
                          {opt}
                        </Text>
                        {selected && <Check size={18} color={theme.accent} strokeWidth={2.5} />}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </Modal>

            <InputField
              label="Téléphone"
              value={form.phone}
              onChangeText={setField('phone')}
              placeholder="01 23 45 67 89"
              keyboardType="phone-pad"
              autoCapitalize="none"
              error={errors.phone}
            />
          </Animated.View>

          {/* Adresse */}
          <Animated.View
            entering={FadeInDown.delay(60).duration(300)}
            style={{
              backgroundColor: theme.card,
              borderRadius: 22,
              borderWidth: 1,
              borderColor: theme.cardBorder,
              padding: 16,
            }}
          >
            <SectionHeader
              icon={<MapPin size={14} color={theme.green} />}
              label="Adresse"
              bg={theme.greenBg}
            />
            <InputField
              label="Rue"
              value={form.address}
              onChangeText={setField('address')}
              placeholder="12 rue de la Paix"
              error={errors.address}
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <InputField
                  label="Ville"
                  value={form.city}
                  onChangeText={setField('city')}
                  placeholder="Paris"
                  error={errors.city}
                />
              </View>
              <View style={{ width: 110 }}>
                <InputField
                  label="Code postal"
                  value={form.postal_code}
                  onChangeText={setField('postal_code')}
                  placeholder="75001"
                  keyboardType="numeric"
                  autoCapitalize="none"
                  error={errors.postal_code}
                />
              </View>
            </View>
          </Animated.View>

          {/* Responsable */}
          <Animated.View
            entering={FadeInDown.delay(120).duration(300)}
            style={{
              backgroundColor: theme.card,
              borderRadius: 22,
              borderWidth: 1,
              borderColor: theme.cardBorder,
              padding: 16,
            }}
          >
            <SectionHeader
              icon={<User size={14} color={theme.primary} />}
              label="Responsable"
              bg={theme.primaryBg}
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <InputField
                  label="Prénom"
                  value={form.manager_first_name}
                  onChangeText={setField('manager_first_name')}
                  placeholder="Jean"
                  autoCapitalize="words"
                  error={errors.manager_first_name}
                />
              </View>
              <View style={{ flex: 1 }}>
                <InputField
                  label="Nom"
                  value={form.manager_last_name}
                  onChangeText={setField('manager_last_name')}
                  placeholder="Dupont"
                  autoCapitalize="words"
                  error={errors.manager_last_name}
                />
              </View>
            </View>
            {/* Fonction picker */}
            <View style={{ marginBottom: 14 }}>
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: 13,
                  fontWeight: '600',
                  marginBottom: 6,
                }}
              >
                Fonction
              </Text>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setFunctionPickerOpen(true);
                }}
                activeOpacity={0.75}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: theme.input,
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  paddingVertical: 14,
                  borderWidth: 1,
                  borderColor: errors.manager_function
                    ? theme.red
                    : form.manager_function
                    ? theme.accent
                    : theme.inputBorder,
                }}
              >
                <Briefcase size={16} color={theme.textMuted} style={{ marginRight: 10 }} />
                <Text
                  style={{
                    flex: 1,
                    fontSize: 15,
                    color: form.manager_function ? theme.text : theme.placeholder,
                  }}
                  numberOfLines={1}
                >
                  {form.manager_function || 'Sélectionnez une fonction'}
                </Text>
                <ChevronDown
                  size={16}
                  color={form.manager_function ? theme.accent : theme.textMuted}
                  strokeWidth={2.5}
                />
              </TouchableOpacity>
              {errors.manager_function ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <AlertCircle size={13} color={theme.red} />
                  <Text style={{ color: theme.red, fontSize: 12 }}>{errors.manager_function}</Text>
                </View>
              ) : null}
            </View>

            <Modal
              visible={functionPickerOpen}
              transparent
              animationType="slide"
              onRequestClose={() => setFunctionPickerOpen(false)}
            >
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }}
                activeOpacity={1}
                onPress={() => setFunctionPickerOpen(false)}
              />
              <View
                style={{
                  backgroundColor: theme.card,
                  borderTopLeftRadius: 28,
                  borderTopRightRadius: 28,
                  paddingTop: 12,
                  paddingBottom: insets.bottom + 24,
                }}
              >
                <View style={{ alignItems: 'center', marginBottom: 16 }}>
                  <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: theme.inputBorder }} />
                </View>
                <Text style={{ fontSize: 17, fontWeight: '800', color: theme.text, paddingHorizontal: 20, marginBottom: 12, letterSpacing: -0.3 }}>
                  Fonction
                </Text>
                <ScrollView showsVerticalScrollIndicator={false} bounces={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 6, paddingBottom: 8 }}>
                  {MANAGER_FUNCTIONS.map(opt => {
                    const selected = form.manager_function === opt;
                    return (
                      <TouchableOpacity
                        key={opt}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setField('manager_function')(opt);
                          setFunctionPickerOpen(false);
                        }}
                        activeOpacity={0.75}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 14,
                          paddingHorizontal: 16,
                          borderRadius: 16,
                          borderWidth: 1.5,
                          borderColor: selected ? theme.accent : theme.cardBorder,
                          backgroundColor: selected
                            ? (theme.isDark ? 'rgba(249,115,22,0.12)' : 'rgba(249,115,22,0.08)')
                            : theme.bg,
                        }}
                      >
                        <Text style={{ flex: 1, fontSize: 15, fontWeight: selected ? '700' : '500', color: selected ? theme.accent : theme.text }}>
                          {opt}
                        </Text>
                        {selected && <Check size={18} color={theme.accent} strokeWidth={2.5} />}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </Modal>
          </Animated.View>

          {/* CTA */}
          <Animated.View entering={FadeInDown.delay(180).duration(300)}>
            <TouchableOpacity
              onPress={handleSave}
              disabled={isBusy}
              style={{
                backgroundColor: theme.accent,
                borderRadius: 18,
                paddingVertical: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                opacity: isBusy ? 0.6 : 1,
              }}
            >
              {isBusy ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Check size={18} color="#fff" strokeWidth={2.5} />
                  <Text
                    style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}
                  >
                    Enregistrer les modifications
                  </Text>
                </>
              )}
            </TouchableOpacity>
            {updateSchool.isError ? (
              <Text
                style={{
                  color: theme.red,
                  fontSize: 13,
                  textAlign: 'center',
                  marginTop: 8,
                }}
              >
                Impossible d'enregistrer. Réessayez.
              </Text>
            ) : null}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
});

function SectionHeader({
  icon,
  label,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  bg: string;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 14,
      }}
    >
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 9,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </View>
      <Text style={{ color: theme.text, fontSize: 15, fontWeight: '700' }}>
        {label}
      </Text>
    </View>
  );
}
