import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSession } from '@/features/auth/store/auth.store';
import { useAddChild } from '@/features/parent/hooks/useChildren';
import { useImagePicker } from '@/hooks';
import { SchoolPickerSheet } from '@/features/parent/components/ui/SchoolPickerSheet';
import type { SchoolSearchResult } from '@/features/school/services/schoolSearch.service';
import { useTranslation } from 'react-i18next';

interface FormData {
  firstName: string;
  lastName: string;
  className: string;
}

type FormErrors = Partial<Record<keyof FormData | 'school', string>>;

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

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  autoCapitalize = 'sentences',
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  error?: string;
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
          <Ionicons name="alert-circle-outline" size={13} color={theme.red} />
          <Text style={{ color: theme.red, fontSize: 12 }}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function AddChild() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const session = useSession();
  const userId = session?.user.id ?? '';
  const { t: i18n } = useTranslation('parent');

  const addChild = useAddChild();
  const { pickFromGallery, takePhoto, isUploading } = useImagePicker({
    bucket: 'children-images',
    userId,
  });

  const [form, setForm] = useState<FormData>({
    firstName: '',
    lastName: '',
    className: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [selectedSchool, setSelectedSchool] =
    useState<SchoolSearchResult | null>(null);
  const [schoolPickerVisible, setSchoolPickerVisible] = useState(false);

  const setField = useCallback(
    (field: keyof FormData) => (value: string) => {
      setForm(prev => ({ ...prev, [field]: value }));
      setErrors(prev => ({ ...prev, [field]: undefined }));
    },
    []
  );

  const validate = useCallback((): boolean => {
    const next: FormErrors = {};
    if (!form.firstName.trim())
      next.firstName = i18n('add_child_error_first_name');
    if (!form.lastName.trim())
      next.lastName = i18n('add_child_error_last_name');
    if (!form.className.trim()) next.className = i18n('add_child_error_class');
    if (!selectedSchool) next.school = i18n('add_child_error_school');
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [form, selectedSchool, i18n]);

  const handlePickPhoto = useCallback(() => {
    Alert.alert(
      i18n('add_child_photo_picker_title'),
      i18n('add_child_photo_picker_subtitle'),
      [
        {
          text: i18n('add_child_camera'),
          onPress: async () => {
            const result = await takePhoto();
            if (result) {
              setPhotoUri(result.signedUrl);
              setPhotoUrl(result.signedUrl);
            }
          },
        },
        {
          text: i18n('add_child_gallery'),
          onPress: async () => {
            const result = await pickFromGallery();
            if (result) {
              setPhotoUri(result.signedUrl);
              setPhotoUrl(result.signedUrl);
            }
          },
        },
        { text: i18n('guardian_add_relation_cancel'), style: 'cancel' },
      ]
    );
  }, [takePhoto, pickFromGallery, i18n]);

  const handleSchoolSelect = useCallback((school: SchoolSearchResult) => {
    setSelectedSchool(school);
    setErrors(prev => ({ ...prev, school: undefined }));
    setSchoolPickerVisible(false);
    if (__DEV__) console.log('[AddChild] école liée:', school.name, school.id);
  }, []);

  const handleSave = useCallback(async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await addChild.mutateAsync({
      first_name: form.firstName.trim(),
      last_name: form.lastName.trim(),
      date_of_birth: null,
      class_name: form.className.trim(),
      photo_url: photoUrl,
      school_id: selectedSchool?.id ?? null,
    });
    if (__DEV__)
      console.log(
        '[AddChild] enfant créé, school_id:',
        selectedSchool?.id ?? 'null'
      );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }, [validate, addChild, form, photoUrl, selectedSchool, router]);

  const isBusy = addChild.isPending || isUploading;

  return (
    <>
      <SchoolPickerSheet
        visible={schoolPickerVisible}
        onSelect={handleSchoolSelect}
        onClose={() => setSchoolPickerVisible(false)}
      />
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: theme.bg }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ padding: 20, gap: 16 }}>
            {/* Photo picker */}
            <Animated.View
              entering={FadeInDown.delay(80).duration(400)}
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
                  marginBottom: 12,
                }}
              >
                {i18n('add_child_photo_label')}
              </Text>

              {photoUri ? (
                <View style={{ alignItems: 'center', marginBottom: 12 }}>
                  <Image
                    source={{ uri: photoUri }}
                    style={{ width: 88, height: 88, borderRadius: 22 }}
                  />
                </View>
              ) : null}

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  onPress={handlePickPhoto}
                  disabled={isUploading}
                  style={{
                    flex: 1,
                    height: 72,
                    backgroundColor: theme.iconBg,
                    borderRadius: 16,
                    borderWidth: 1.5,
                    borderColor: theme.cardBorder,
                    borderStyle: 'dashed',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  {isUploading ? (
                    <ActivityIndicator color={theme.accent} size="small" />
                  ) : (
                    <>
                      <Ionicons
                        name="camera-outline"
                        size={20}
                        color={theme.textMuted}
                      />
                      <Text
                        style={{
                          color: theme.textMuted,
                          fontSize: 12,
                          fontWeight: '600',
                        }}
                      >
                        {photoUri
                          ? i18n('add_child_photo_change')
                          : i18n('add_child_photo_btn')}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Identity */}
            <Animated.View
              entering={FadeInDown.delay(120).duration(400)}
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
                  <Ionicons
                    name="person-outline"
                    size={14}
                    color={theme.primary}
                  />
                </View>
                <Text
                  style={{ color: theme.text, fontSize: 15, fontWeight: '700' }}
                >
                  {i18n('add_child_identity')}
                </Text>
              </View>
              <InputField
                label={i18n('edit_child_first_name')}
                value={form.firstName}
                onChangeText={setField('firstName')}
                placeholder={i18n('edit_child_first_name_placeholder')}
                autoCapitalize="words"
                error={errors.firstName}
              />
              <InputField
                label={i18n('edit_child_last_name')}
                value={form.lastName}
                onChangeText={setField('lastName')}
                placeholder={i18n('edit_child_last_name_placeholder')}
                autoCapitalize="words"
                error={errors.lastName}
              />
            </Animated.View>

            {/* Scolarité */}
            <Animated.View
              entering={FadeInDown.delay(160).duration(400)}
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
                  <Ionicons
                    name="school-outline"
                    size={14}
                    color={theme.accent}
                  />
                </View>
                <Text
                  style={{ color: theme.text, fontSize: 15, fontWeight: '700' }}
                >
                  {i18n('add_child_schooling')}
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
                {i18n('add_child_class_label')}
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
                  <Ionicons
                    name="alert-circle-outline"
                    size={13}
                    color={theme.red}
                  />
                  <Text style={{ color: theme.red, fontSize: 12 }}>
                    {errors.className}
                  </Text>
                </View>
              ) : null}
            </Animated.View>

            {/* Établissement */}
            <Animated.View
              entering={FadeInDown.delay(190).duration(400)}
              style={{
                backgroundColor: theme.card,
                borderRadius: 22,
                borderWidth: 1,
                borderColor: errors.school
                  ? theme.red
                  : selectedSchool
                    ? 'rgba(16,185,129,0.3)'
                    : theme.cardBorder,
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
                  <Ionicons
                    name="business-outline"
                    size={14}
                    color={theme.primary}
                  />
                </View>
                <Text
                  style={{ color: theme.text, fontSize: 15, fontWeight: '700' }}
                >
                  {i18n('add_child_school_section')}
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
                  borderColor: selectedSchool
                    ? 'rgba(16,185,129,0.25)'
                    : theme.cardBorder,
                  padding: 14,
                }}
              >
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 11,
                    backgroundColor: selectedSchool
                      ? theme.greenBg
                      : theme.primaryBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {selectedSchool ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={theme.green}
                    />
                  ) : (
                    <Ionicons
                      name="business-outline"
                      size={18}
                      color={theme.primary}
                    />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  {selectedSchool ? (
                    <>
                      <Text
                        style={{
                          color: theme.text,
                          fontSize: 14,
                          fontWeight: '700',
                        }}
                        numberOfLines={1}
                      >
                        {selectedSchool.name}
                      </Text>
                      <Text
                        style={{
                          color: theme.textMuted,
                          fontSize: 12,
                          marginTop: 2,
                        }}
                        numberOfLines={1}
                      >
                        {selectedSchool.city} · {selectedSchool.type}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text
                        style={{
                          color: theme.text,
                          fontSize: 14,
                          fontWeight: '600',
                        }}
                      >
                        {i18n('add_child_school_search')}
                      </Text>
                      <Text
                        style={{
                          color: theme.textMuted,
                          fontSize: 12,
                          marginTop: 2,
                        }}
                      >
                        {i18n('add_child_school_auto_enroll')}
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

              {selectedSchool ? (
                <TouchableOpacity
                  onPress={() => setSelectedSchool(null)}
                  style={{ marginTop: 10, alignSelf: 'flex-start' }}
                >
                  <Text
                    style={{
                      color: theme.red,
                      fontSize: 12,
                      fontWeight: '600',
                    }}
                  >
                    {i18n('add_child_school_remove')}
                  </Text>
                </TouchableOpacity>
              ) : errors.school ? (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    marginTop: 8,
                  }}
                >
                  <Ionicons
                    name="alert-circle-outline"
                    size={13}
                    color={theme.red}
                  />
                  <Text style={{ color: theme.red, fontSize: 12 }}>
                    {errors.school}
                  </Text>
                </View>
              ) : null}
            </Animated.View>

            {/* Save */}
            <Animated.View entering={FadeInDown.delay(230).duration(400)}>
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
                    <Ionicons name="save-outline" size={18} color="#fff" />
                    <Text
                      style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}
                    >
                      {i18n('add_child_save')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              {addChild.isError ? (
                <Text
                  style={{
                    color: theme.red,
                    fontSize: 13,
                    textAlign: 'center',
                    marginTop: 8,
                  }}
                >
                  {i18n('add_child_save_error')}
                </Text>
              ) : null}
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
