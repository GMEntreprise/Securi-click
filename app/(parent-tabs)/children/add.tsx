import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  User,
  GraduationCap,
  AlertCircle,
  Save,
  Camera,
  ImageIcon,
} from 'lucide-react-native';

interface FormData {
  firstName: string;
  lastName: string;
  age: string;
  school: string;
  grade: string;
}

type FormErrors = Partial<Record<keyof FormData, string>>;

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
  keyboardType = 'default',
  error,
  autoCapitalize = 'sentences',
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
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
        keyboardType={keyboardType}
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

export default function AddChild() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const [form, setForm] = useState<FormData>({
    firstName: '',
    lastName: '',
    age: '',
    school: '',
    grade: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  const setField = useCallback(
    (field: keyof FormData) => (value: string) => {
      setForm(prev => ({ ...prev, [field]: value }));
      setErrors(prev => ({ ...prev, [field]: undefined }));
    },
    []
  );

  const validate = useCallback((): boolean => {
    const next: FormErrors = {};
    if (!form.firstName.trim()) next.firstName = 'Prénom requis';
    if (!form.lastName.trim()) next.lastName = 'Nom requis';
    if (!form.age.trim() || isNaN(Number(form.age)) || Number(form.age) < 1)
      next.age = 'Âge invalide';
    if (!form.school.trim()) next.school = 'École requise';
    if (!form.grade.trim()) next.grade = 'Classe requise';
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [form]);

  const handleSave = useCallback(() => {
    btnScale.value = withSpring(0.95, { damping: 12 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => {
      btnScale.value = withSpring(1);
      if (validate()) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      }
    }, 100);
  }, [validate, btnScale, router]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={{
            backgroundColor: theme.card,
            borderBottomWidth: 1,
            borderBottomColor: theme.cardBorder,
            paddingTop: insets.top + 16,
            paddingBottom: 20,
            paddingHorizontal: 20,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <TouchableOpacity
            onPress={handleBack}
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
              Nouveau
            </Text>
            <Text
              style={{
                color: theme.text,
                fontSize: 22,
                fontWeight: '800',
                letterSpacing: -0.5,
              }}
            >
              Ajouter un enfant
            </Text>
          </View>
        </Animated.View>

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
              Photo
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() =>
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                }
                style={{
                  flex: 1,
                  height: 80,
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
                <Camera size={22} color={theme.textMuted} />
                <Text
                  style={{
                    color: theme.textMuted,
                    fontSize: 12,
                    fontWeight: '600',
                  }}
                >
                  Caméra
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                }
                style={{
                  flex: 1,
                  height: 80,
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
                <ImageIcon size={22} color={theme.textMuted} />
                <Text
                  style={{
                    color: theme.textMuted,
                    fontSize: 12,
                    fontWeight: '600',
                  }}
                >
                  Galerie
                </Text>
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
                <User size={14} color={theme.primary} />
              </View>
              <Text
                style={{
                  color: theme.text,
                  fontSize: 15,
                  fontWeight: '700',
                }}
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
            <InputField
              label="Âge"
              value={form.age}
              onChangeText={setField('age')}
              placeholder="Ex: 7"
              keyboardType="numeric"
              error={errors.age}
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
                <GraduationCap size={14} color={theme.accent} />
              </View>
              <Text
                style={{
                  color: theme.text,
                  fontSize: 15,
                  fontWeight: '700',
                }}
              >
                Scolarité
              </Text>
            </View>
            <InputField
              label="École"
              value={form.school}
              onChangeText={setField('school')}
              placeholder="Nom de l'établissement"
              error={errors.school}
            />
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
                const active = form.grade === g;
                return (
                  <TouchableOpacity
                    key={g}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setField('grade')(g);
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
            {errors.grade ? (
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
                  {errors.grade}
                </Text>
              </View>
            ) : null}
          </Animated.View>

          {/* Save */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(400)}
            style={btnStyle}
          >
            <TouchableOpacity
              onPress={handleSave}
              style={{
                backgroundColor: theme.accent,
                borderRadius: 18,
                paddingVertical: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Save size={18} color="#fff" strokeWidth={2.5} />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
                Enregistrer l'enfant
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
