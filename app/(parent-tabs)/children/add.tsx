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
import {
  ArrowLeft,
  User,
  GraduationCap,
  AlertCircle,
  Save,
  Camera,
} from 'lucide-react-native';
import { useSession } from '@/features/auth/store/auth.store';
import { useAddChild } from '@/features/parent/hooks/useChildren';
import { useImagePicker } from '@/hooks';

interface FormData {
  firstName: string;
  lastName: string;
  className: string;
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
  const session = useSession();
  const userId = session?.user.id ?? '';

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
          if (result) {
            setPhotoUri(result.signedUrl);
            setPhotoUrl(result.signedUrl);
          }
        },
      },
      {
        text: 'Galerie',
        onPress: async () => {
          const result = await pickFromGallery();
          if (result) {
            setPhotoUri(result.signedUrl);
            setPhotoUrl(result.signedUrl);
          }
        },
      },
      { text: 'Annuler', style: 'cancel' },
    ]);
  }, [takePhoto, pickFromGallery]);

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
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }, [validate, addChild, form, photoUrl, router]);

  const isBusy = addChild.isPending || isUploading;

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
                    <Camera size={20} color={theme.textMuted} />
                    <Text
                      style={{
                        color: theme.textMuted,
                        fontSize: 12,
                        fontWeight: '600',
                      }}
                    >
                      {photoUri ? 'Changer' : 'Caméra / Galerie'}
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

          {/* Save */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
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
                  <Save size={18} color="#fff" strokeWidth={2.5} />
                  <Text
                    style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}
                  >
                    Enregistrer l'enfant
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
                Une erreur est survenue. Réessayez.
              </Text>
            ) : null}
          </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
