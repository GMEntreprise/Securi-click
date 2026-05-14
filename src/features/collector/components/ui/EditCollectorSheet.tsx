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
  Camera,
  Check,
  Phone,
  User,
  X,
} from 'lucide-react-native';
import { Avatar } from '@/shared/ui/base/avatar';
import { useTheme } from '@/theme';
import {
  useUpdateCollectorProfile,
  useUpdateCollectorAvatarUrl,
} from '../../hooks/useCollector';
import { useSession } from '@/features/auth/store/auth.store';
import { useImagePicker } from '@/hooks';

interface CollectorProfile {
  first_name: string;
  last_name: string;
  phone: string | null;
  avatar_url: string | null;
}

interface EditCollectorSheetProps {
  profile: CollectorProfile;
  onClose: () => void;
}

interface FormState {
  firstName: string;
  lastName: string;
  phone: string;
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
  keyboardType?: 'default' | 'phone-pad' | 'email-address';
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

export const EditCollectorSheet = memo(function EditCollectorSheet({
  profile,
  onClose,
}: EditCollectorSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const session = useSession();
  const userId = session?.user.id ?? '';

  const updateProfile = useUpdateCollectorProfile();
  const updateAvatarUrl = useUpdateCollectorAvatarUrl();
  const { pickFromGallery, takePhoto, isUploading } = useImagePicker({
    bucket: 'collector-avatars',
    userId,
  });

  const [form, setForm] = useState<FormState>({
    firstName: profile.first_name,
    lastName: profile.last_name,
    phone: profile.phone ?? '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [avatarUri, setAvatarUri] = useState<string | null>(profile.avatar_url);

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
    if (form.phone.trim().length > 0 && form.phone.trim().length < 10)
      next.phone = 'Numéro invalide';
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [form]);

  const handlePickPhoto = useCallback(() => {
    Alert.alert('Photo de profil', 'Choisir une source', [
      {
        text: 'Caméra',
        onPress: async () => {
          const result = await takePhoto();
          if (result) {
            setAvatarUri(result.signedUrl);
            await updateAvatarUrl.mutateAsync(result.signedUrl);
          }
        },
      },
      {
        text: 'Galerie',
        onPress: async () => {
          const result = await pickFromGallery();
          if (result) {
            setAvatarUri(result.signedUrl);
            await updateAvatarUrl.mutateAsync(result.signedUrl);
          }
        },
      },
      { text: 'Annuler', style: 'cancel' },
    ]);
  }, [takePhoto, pickFromGallery, updateAvatarUrl]);

  const handleSave = useCallback(async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await updateProfile.mutateAsync({
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        phone: form.phone.trim(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [validate, updateProfile, form, onClose]);

  const isBusy =
    updateProfile.isPending || isUploading || updateAvatarUrl.isPending;

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
          Modifier le profil
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
          {/* Avatar */}
          <Animated.View
            entering={FadeInDown.duration(300)}
            style={{ alignItems: 'center', paddingVertical: 8 }}
          >
            <TouchableOpacity
              onPress={handlePickPhoto}
              disabled={isBusy}
              style={{ marginBottom: 12 }}
            >
              <Avatar
                image={{
                  uri: avatarUri ?? '',
                  name: `${form.firstName} ${form.lastName}`.trim(),
                }}
                size={90}
                showBorder={false}
                backgroundColor={theme.accentBg}
                textColor={theme.accent}
                loading={isUploading || updateAvatarUrl.isPending}
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
            <Text style={{ color: theme.textMuted, fontSize: 12 }}>
              Appuyer pour modifier la photo
            </Text>
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
              placeholder="Votre prénom"
              autoCapitalize="words"
              error={errors.firstName}
            />
            <InputField
              label="Nom"
              value={form.lastName}
              onChangeText={setField('lastName')}
              placeholder="Votre nom"
              autoCapitalize="words"
              error={errors.lastName}
            />
          </Animated.View>

          {/* Contact */}
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
                  backgroundColor: theme.greenBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Phone size={14} color={theme.green} />
              </View>
              <Text
                style={{ color: theme.text, fontSize: 15, fontWeight: '700' }}
              >
                Contact
              </Text>
            </View>
            <InputField
              label="Téléphone"
              value={form.phone}
              onChangeText={setField('phone')}
              placeholder="+33 6 00 00 00 00"
              keyboardType="phone-pad"
              autoCapitalize="none"
              error={errors.phone}
            />
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
            {updateProfile.isError ? (
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
