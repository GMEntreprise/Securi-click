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
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { useUpdateSchool } from '../../hooks/useSchool';
import { Toast } from '@/shared/ui/molecules/Toast';
import type { SchoolProfile } from '../../types';
import { SchoolPickerSheet } from '@/features/parent/components/ui/SchoolPickerSheet';
import type { SchoolSearchResult } from '@/features/school/services/schoolSearch.service';
import { useTranslation } from 'react-i18next';

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
          <Ionicons name="alert-circle-outline" size={13} color={theme.red} />
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
  const { t: i18n } = useTranslation('school');
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
  const [schoolPickerVisible, setSchoolPickerVisible] = useState(false);

  const setField = useCallback(
    (field: keyof FormState) => (value: string) => {
      setForm(prev => ({ ...prev, [field]: value }));
      setErrors(prev => ({ ...prev, [field]: undefined }));
    },
    []
  );

  const handleSchoolSelect = useCallback((school: SchoolSearchResult) => {
    setForm(prev => ({
      ...prev,
      name: school.name,
      type: school.type || prev.type,
      address: school.address || prev.address,
      city: school.city || prev.city,
      postal_code: school.postal_code || prev.postal_code,
    }));
    setErrors(prev => ({
      ...prev,
      name: undefined,
      address: undefined,
      city: undefined,
      postal_code: undefined,
    }));
    setSchoolPickerVisible(false);
  }, []);

  const validate = useCallback((): boolean => {
    const next: FormErrors = {};
    if (!form.name.trim()) next.name = i18n('edit_school_error_name');
    if (!form.phone.trim()) next.phone = i18n('edit_school_error_phone');
    if (!form.address.trim()) next.address = i18n('edit_school_error_address');
    if (!form.city.trim()) next.city = i18n('edit_school_error_city');
    if (!form.postal_code.trim() || form.postal_code.trim().length < 5)
      next.postal_code = i18n('edit_school_error_postal');
    if (!form.manager_first_name.trim())
      next.manager_first_name = i18n('edit_school_error_first_name');
    if (!form.manager_last_name.trim())
      next.manager_last_name = i18n('edit_school_error_last_name');
    if (!form.manager_function.trim())
      next.manager_function = i18n('edit_school_error_function');
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [form, i18n]);

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
      Toast.show(i18n('edit_school_save_success'), {
        type: 'success',
        duration: 2500,
      });
      onClose();
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show(i18n('edit_school_save_error'), {
        type: 'error',
        duration: 3000,
      });
    }
  }, [validate, updateSchool, school.id, form, onClose, i18n]);

  const isBusy = updateSchool.isPending;

  return (
    <>
      <SchoolPickerSheet
        visible={schoolPickerVisible}
        onSelect={handleSchoolSelect}
        onClose={() => setSchoolPickerVisible(false)}
      />
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        {/* Handle */}
        <View
          style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}
        >
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
            {i18n('edit_school_title')}
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
            <Ionicons name="close" size={18} color={theme.textSecondary} />
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
                icon={
                  <Ionicons
                    name="business-outline"
                    size={14}
                    color={theme.accent}
                  />
                }
                label={i18n('edit_school_section_school')}
                bg={theme.accentBg}
              />
              <InputField
                label={i18n('edit_school_name_label')}
                value={form.name}
                onChangeText={setField('name')}
                placeholder={i18n('edit_school_name_placeholder')}
                autoCapitalize="words"
                error={errors.name}
              />
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSchoolPickerVisible(true);
                }}
                activeOpacity={0.75}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  backgroundColor: theme.iconBg,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: theme.cardBorder,
                  padding: 12,
                  marginBottom: 14,
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    backgroundColor: theme.primaryBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Ionicons
                    name="search-outline"
                    size={15}
                    color={theme.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: theme.text,
                      fontSize: 13,
                      fontWeight: '700',
                    }}
                  >
                    {i18n('edit_school_search_official')}
                  </Text>
                  <Text
                    style={{
                      color: theme.textMuted,
                      fontSize: 12,
                      marginTop: 1,
                    }}
                  >
                    {i18n('edit_school_search_subtitle')}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={15}
                  color={theme.textMuted}
                />
              </TouchableOpacity>

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
                  {i18n('edit_school_type_label')}
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
                  <Ionicons
                    name="school-outline"
                    size={16}
                    color={theme.textMuted}
                    style={{ marginRight: 10 }}
                  />
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 15,
                      color: form.type ? theme.text : theme.placeholder,
                    }}
                    numberOfLines={1}
                  >
                    {form.type || i18n('edit_school_type_placeholder')}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color={form.type ? theme.accent : theme.textMuted}
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
                    <View
                      style={{
                        width: 40,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: theme.inputBorder,
                      }}
                    />
                  </View>
                  <Text
                    style={{
                      fontSize: 17,
                      fontWeight: '800',
                      color: theme.text,
                      paddingHorizontal: 20,
                      marginBottom: 12,
                      letterSpacing: -0.3,
                    }}
                  >
                    {i18n('edit_school_type_picker_title')}
                  </Text>
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                    contentContainerStyle={{
                      paddingHorizontal: 16,
                      gap: 6,
                      paddingBottom: 8,
                    }}
                  >
                    {SCHOOL_TYPES.map(opt => {
                      const selected = form.type === opt;
                      return (
                        <TouchableOpacity
                          key={opt}
                          onPress={() => {
                            Haptics.impactAsync(
                              Haptics.ImpactFeedbackStyle.Light
                            );
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
                            borderColor: selected
                              ? theme.accent
                              : theme.cardBorder,
                            backgroundColor: selected
                              ? theme.isDark
                                ? 'rgba(249,115,22,0.12)'
                                : 'rgba(249,115,22,0.08)'
                              : theme.bg,
                          }}
                        >
                          <Text
                            style={{
                              flex: 1,
                              fontSize: 15,
                              fontWeight: selected ? '700' : '500',
                              color: selected ? theme.accent : theme.text,
                            }}
                          >
                            {opt}
                          </Text>
                          {selected && (
                            <Ionicons
                              name="checkmark"
                              size={18}
                              color={theme.accent}
                            />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              </Modal>

              <InputField
                label={i18n('edit_school_phone_label')}
                value={form.phone}
                onChangeText={setField('phone')}
                placeholder={i18n('edit_school_phone_placeholder')}
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
                icon={
                  <Ionicons
                    name="location-outline"
                    size={14}
                    color={theme.green}
                  />
                }
                label={i18n('edit_school_section_address')}
                bg={theme.greenBg}
              />
              <InputField
                label={i18n('edit_school_address_label')}
                value={form.address}
                onChangeText={setField('address')}
                placeholder={i18n('edit_school_address_placeholder')}
                error={errors.address}
              />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <InputField
                    label={i18n('edit_school_city_label')}
                    value={form.city}
                    onChangeText={setField('city')}
                    placeholder={i18n('edit_school_city_placeholder')}
                    error={errors.city}
                  />
                </View>
                <View style={{ width: 110 }}>
                  <InputField
                    label={i18n('edit_school_postal_label')}
                    value={form.postal_code}
                    onChangeText={setField('postal_code')}
                    placeholder={i18n('edit_school_postal_placeholder')}
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
                icon={
                  <Ionicons
                    name="person-outline"
                    size={14}
                    color={theme.primary}
                  />
                }
                label={i18n('edit_school_section_manager')}
                bg={theme.primaryBg}
              />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <InputField
                    label={i18n('edit_school_manager_first_name_label')}
                    value={form.manager_first_name}
                    onChangeText={setField('manager_first_name')}
                    placeholder={i18n(
                      'edit_school_manager_first_name_placeholder'
                    )}
                    autoCapitalize="words"
                    error={errors.manager_first_name}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <InputField
                    label={i18n('edit_school_manager_last_name_label')}
                    value={form.manager_last_name}
                    onChangeText={setField('manager_last_name')}
                    placeholder={i18n(
                      'edit_school_manager_last_name_placeholder'
                    )}
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
                  {i18n('edit_school_function_label')}
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
                  <Ionicons
                    name="briefcase-outline"
                    size={16}
                    color={theme.textMuted}
                    style={{ marginRight: 10 }}
                  />
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 15,
                      color: form.manager_function
                        ? theme.text
                        : theme.placeholder,
                    }}
                    numberOfLines={1}
                  >
                    {form.manager_function ||
                      i18n('edit_school_function_placeholder')}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color={
                      form.manager_function ? theme.accent : theme.textMuted
                    }
                  />
                </TouchableOpacity>
                {errors.manager_function ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      marginTop: 4,
                    }}
                  >
                    <Ionicons
                      name="alert-circle-outline"
                      size={13}
                      color={theme.red}
                    />
                    <Text style={{ color: theme.red, fontSize: 12 }}>
                      {errors.manager_function}
                    </Text>
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
                    <View
                      style={{
                        width: 40,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: theme.inputBorder,
                      }}
                    />
                  </View>
                  <Text
                    style={{
                      fontSize: 17,
                      fontWeight: '800',
                      color: theme.text,
                      paddingHorizontal: 20,
                      marginBottom: 12,
                      letterSpacing: -0.3,
                    }}
                  >
                    {i18n('edit_school_function_picker_title')}
                  </Text>
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                    contentContainerStyle={{
                      paddingHorizontal: 16,
                      gap: 6,
                      paddingBottom: 8,
                    }}
                  >
                    {MANAGER_FUNCTIONS.map(opt => {
                      const selected = form.manager_function === opt;
                      return (
                        <TouchableOpacity
                          key={opt}
                          onPress={() => {
                            Haptics.impactAsync(
                              Haptics.ImpactFeedbackStyle.Light
                            );
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
                            borderColor: selected
                              ? theme.accent
                              : theme.cardBorder,
                            backgroundColor: selected
                              ? theme.isDark
                                ? 'rgba(249,115,22,0.12)'
                                : 'rgba(249,115,22,0.08)'
                              : theme.bg,
                          }}
                        >
                          <Text
                            style={{
                              flex: 1,
                              fontSize: 15,
                              fontWeight: selected ? '700' : '500',
                              color: selected ? theme.accent : theme.text,
                            }}
                          >
                            {opt}
                          </Text>
                          {selected && (
                            <Ionicons
                              name="checkmark"
                              size={18}
                              color={theme.accent}
                            />
                          )}
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
                    <Ionicons name="checkmark" size={18} color="#fff" />
                    <Text
                      style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}
                    >
                      {i18n('edit_school_save')}
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
                  {i18n('edit_school_form_error')}
                </Text>
              ) : null}
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </>
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
