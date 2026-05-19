import React, { memo, useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
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
  Building2,
  Camera,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  User,
  X,
  Check,
  FileText,
} from 'lucide-react-native';
import { Avatar } from '@/shared/ui/base/avatar';
import { useTheme } from '@/theme';
import { useUpdateChild } from '../../hooks/useChildren';
import { useSession } from '@/features/auth/store/auth.store';
import { useImagePicker } from '@/hooks';
import type { Child } from '../../types';
import { Toast } from '@/shared/ui/molecules/Toast';
import { SchoolPickerSheet } from './SchoolPickerSheet';
import type { SchoolSearchResult } from '@/features/school/services/schoolSearch.service';

const GRADES = [
  'TPS',
  'PS',
  'MS',
  'GS',
  'CP',
  'CE1',
  'CE2',
  'CM1',
  'CM2',
  '6ème',
  '5ème',
  '4ème',
  '3ème',
];

interface FormState {
  firstName: string;
  lastName: string;
  className: string;
  medicalNotes: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

interface EditChildSheetProps {
  child: Child;
  onClose: () => void;
}

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  multiline,
  autoCapitalize = 'sentences',
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  error?: string;
  multiline?: boolean;
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
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        style={{
          backgroundColor: theme.input,
          borderWidth: 1,
          borderColor: error ? theme.red : theme.inputBorder,
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 15,
          color: theme.text,
          minHeight: multiline ? 80 : undefined,
          textAlignVertical: multiline ? 'top' : undefined,
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

export const EditChildSheet = memo(function EditChildSheet({
  child,
  onClose,
}: EditChildSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const session = useSession();
  const userId = session?.user.id ?? '';

  const updateChild = useUpdateChild();
  const { pickFromGallery, takePhoto, isUploading } = useImagePicker({
    bucket: 'children-images',
    userId,
  });

  const [form, setForm] = useState<FormState>({
    firstName: child.first_name,
    lastName: child.last_name,
    className: child.class_name ?? '',
    medicalNotes: child.medical_notes ?? '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [photoUri, setPhotoUri] = useState<string | null>(child.photo_url);
  const [selectedSchool, setSelectedSchool] = useState<SchoolSearchResult | null>(
    child.school
      ? { id: child.school.id, name: child.school.name, city: child.school.city, type: child.school.type, normalized_name: '', address: '', postal_code: '', logo_url: null, is_active: true, confidence: 100 }
      : null
  );
  const [schoolPickerVisible, setSchoolPickerVisible] = useState(false);

  const setField = useCallback(
    (field: keyof FormState) => (value: string) => {
      setForm(prev => ({ ...prev, [field]: value }));
      setErrors(prev => ({ ...prev, [field]: undefined }));
    },
    []
  );

  const validate = useCallback((): boolean => {
    const next: FormErrors = {};
    if (!form.firstName.trim()) next.firstName = 'Prénom requis';
    if (!form.lastName.trim()) next.lastName = 'Nom requis';
    if (!form.className.trim()) next.className = 'Classe requise';
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [form]);

  const handlePickPhoto = useCallback(() => {
    Alert.alert("Photo de l'enfant", 'Choisir une source', [
      {
        text: 'Caméra',
        onPress: async () => {
          const result = await takePhoto();
          if (result) setPhotoUri(result.signedUrl);
        },
      },
      {
        text: 'Galerie',
        onPress: async () => {
          const result = await pickFromGallery();
          if (result) setPhotoUri(result.signedUrl);
        },
      },
      { text: 'Annuler', style: 'cancel' },
    ]);
  }, [takePhoto, pickFromGallery]);

  const handleSchoolSelect = useCallback((school: SchoolSearchResult) => {
    setSelectedSchool(school);
    setSchoolPickerVisible(false);
  }, []);

  const handleSave = useCallback(async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await updateChild.mutateAsync({
        childId: child.id,
        payload: {
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          class_name: form.className.trim(),
          medical_notes: form.medicalNotes.trim() || null,
          photo_url: photoUri,
          school_id: selectedSchool?.id ?? null,
        },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show(`Profil de ${form.firstName} mis à jour`, { type: 'success', duration: 2500 });
      onClose();
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show('Impossible de sauvegarder les modifications', { type: 'error', duration: 3000 });
    }
  }, [validate, updateChild, child.id, form, photoUri, selectedSchool, onClose]);

  const isBusy = updateChild.isPending || isUploading;

  return (
    <>
      <SchoolPickerSheet
        visible={schoolPickerVisible}
        onSelect={handleSchoolSelect}
        onClose={() => setSchoolPickerVisible(false)}
      />
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
          Modifier l'enfant
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
          {/* Photo */}
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
            <Text
              style={{
                color: theme.textMuted,
                fontSize: 11,
                fontWeight: '700',
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                marginBottom: 14,
              }}
            >
              Photo
            </Text>
            <View style={{ alignItems: 'center', marginBottom: 14 }}>
              <TouchableOpacity
                onPress={handlePickPhoto}
                disabled={isUploading}
              >
                <Avatar
                  image={{
                    uri: photoUri ?? '',
                    name: `${form.firstName} ${form.lastName}`.trim(),
                  }}
                  size={88}
                  showBorder={false}
                  backgroundColor={theme.primaryBg}
                  textColor={theme.primary}
                  loading={isUploading}
                />
                <View
                  style={{
                    position: 'absolute',
                    bottom: -4,
                    right: -4,
                    width: 28,
                    height: 28,
                    borderRadius: 10,
                    backgroundColor: theme.accent,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: theme.bg,
                  }}
                >
                  <Camera size={13} color="#fff" strokeWidth={2.5} />
                </View>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={handlePickPhoto}
              disabled={isUploading}
              style={{
                height: 44,
                backgroundColor: theme.iconBg,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: theme.cardBorder,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 6,
              }}
            >
              <Camera size={15} color={theme.textMuted} />
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: 13,
                  fontWeight: '600',
                }}
              >
                {photoUri ? 'Changer la photo' : 'Ajouter une photo'}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Identité */}
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
                  backgroundColor: theme.primaryBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <User size={14} color={theme.primary} />
              </View>
              <Text
                style={{ color: theme.text, fontSize: 15, fontWeight: '700' }}
              >
                Identité
              </Text>
            </View>
            <InputField
              label="Prénom"
              value={form.firstName}
              onChangeText={setField('firstName')}
              placeholder="Prénom de l'enfant"
              autoCapitalize="words"
              error={errors.firstName}
            />
            <InputField
              label="Nom"
              value={form.lastName}
              onChangeText={setField('lastName')}
              placeholder="Nom de famille"
              autoCapitalize="words"
              error={errors.lastName}
            />
          </Animated.View>

          {/* Scolarité */}
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
                  backgroundColor: theme.accentBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <GraduationCap size={14} color={theme.accent} />
              </View>
              <Text
                style={{ color: theme.text, fontSize: 15, fontWeight: '700' }}
              >
                Scolarité
              </Text>
            </View>
            <Text
              style={{
                color: theme.textSecondary,
                fontSize: 13,
                fontWeight: '600',
                marginBottom: 8,
              }}
            >
              Classe
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {GRADES.map(g => {
                const active = form.className === g;
                return (
                  <TouchableOpacity
                    key={g}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setField('className')(g);
                    }}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 7,
                      borderRadius: 10,
                      backgroundColor: active ? theme.accent : theme.iconBg,
                      borderWidth: 1,
                      borderColor: active ? 'transparent' : theme.cardBorder,
                    }}
                  >
                    <Text
                      style={{
                        color: active ? '#fff' : theme.textSecondary,
                        fontSize: 13,
                        fontWeight: '700',
                      }}
                    >
                      {g}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {errors.className ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  marginTop: 6,
                }}
              >
                <AlertCircle size={13} color={theme.red} />
                <Text style={{ color: theme.red, fontSize: 12 }}>
                  {errors.className}
                </Text>
              </View>
            ) : null}
          </Animated.View>

          {/* Établissement */}
          <Animated.View
            entering={FadeInDown.delay(150).duration(300)}
            style={{
              backgroundColor: theme.card,
              borderRadius: 22,
              borderWidth: 1,
              borderColor: selectedSchool ? 'rgba(16,185,129,0.3)' : theme.cardBorder,
              padding: 16,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <View style={{ width: 28, height: 28, borderRadius: 9, backgroundColor: theme.primaryBg, alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={14} color={theme.primary} />
              </View>
              <Text style={{ color: theme.text, fontSize: 15, fontWeight: '700' }}>
                Établissement
              </Text>
              <Text style={{ color: theme.textMuted, fontSize: 12, marginLeft: 4 }}>
                (optionnel)
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSchoolPickerVisible(true);
              }}
              activeOpacity={0.75}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                backgroundColor: theme.iconBg,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: selectedSchool ? 'rgba(16,185,129,0.25)' : theme.cardBorder,
                padding: 14,
              }}
            >
              <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: selectedSchool ? theme.greenBg : theme.primaryBg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {selectedSchool
                  ? <CheckCircle2 size={18} color={theme.green} strokeWidth={2} />
                  : <Building2 size={18} color={theme.primary} strokeWidth={1.8} />
                }
              </View>
              <View style={{ flex: 1 }}>
                {selectedSchool ? (
                  <>
                    <Text style={{ color: theme.text, fontSize: 14, fontWeight: '700' }} numberOfLines={1}>
                      {selectedSchool.name}
                    </Text>
                    <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                      {selectedSchool.city} · {selectedSchool.type}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>
                      Rechercher l'école
                    </Text>
                    <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>
                      L'établissement verra votre enfant automatiquement
                    </Text>
                  </>
                )}
              </View>
              <ChevronRight size={16} color={theme.textMuted} strokeWidth={2} />
            </TouchableOpacity>

            {selectedSchool && (
              <TouchableOpacity
                onPress={() => setSelectedSchool(null)}
                style={{ marginTop: 10, alignSelf: 'flex-start' }}
              >
                <Text style={{ color: theme.red, fontSize: 12, fontWeight: '600' }}>
                  Retirer l'établissement
                </Text>
              </TouchableOpacity>
            )}
          </Animated.View>

          {/* Notes médicales */}
          <Animated.View
            entering={FadeInDown.delay(180).duration(300)}
            style={{
              backgroundColor: theme.card,
              borderRadius: 22,
              borderWidth: 1,
              borderColor: theme.cardBorder,
              padding: 16,
            }}
          >
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
                  backgroundColor: theme.amberBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FileText size={14} color={theme.amber} />
              </View>
              <Text
                style={{ color: theme.text, fontSize: 15, fontWeight: '700' }}
              >
                Notes médicales
              </Text>
            </View>
            <InputField
              label="Allergies, traitements, informations utiles"
              value={form.medicalNotes}
              onChangeText={setField('medicalNotes')}
              placeholder="Optionnel"
              multiline
            />
          </Animated.View>

          {/* CTA */}
          <Animated.View entering={FadeInDown.delay(240).duration(300)}>
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
            {updateChild.isError ? (
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
    </>
  );
});
