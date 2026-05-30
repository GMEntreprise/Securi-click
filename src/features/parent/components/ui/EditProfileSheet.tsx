import { AuthInputField } from '@/features/auth/components/ui/AuthInputField';
import { AuthPasswordField } from '@/features/auth/components/ui/AuthPasswordField';
import { PasswordStrengthBar } from '@/features/auth/components/ui/PasswordStrengthBar';
import { useSession } from '@/features/auth/store/auth.store';
import { Avatar } from '@/shared/ui/base/avatar';
import { AvatarPickerSheet } from '@/shared/ui/molecules/AvatarPickerSheet';
import { Toast } from '@/shared/ui/molecules/Toast';
import { useTheme } from '@/theme';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import React, { memo, useCallback, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';
import {
  useChangePassword,
  useUpdateAvatar,
  useUpdateProfile,
} from '../../hooks/useParentProfile';
import { useUploadImage } from '../../hooks/useUploadImage';
import type { ParentProfile } from '../../types';

type ProfileForm = {
  first_name: string;
  last_name: string;
  phone: string;
};
type PasswordForm = {
  new_password: string;
  confirm_password: string;
};

type Tab = 'info' | 'password';

function passwordStrength(pw: string): 'weak' | 'medium' | 'strong' {
  if (pw.length < 8) return 'weak';
  const hasUpper = /[A-Z]/.test(pw);
  const hasNum = /[0-9]/.test(pw);
  const hasSpecial = /[^a-zA-Z0-9]/.test(pw);
  if (hasUpper && hasNum && hasSpecial) return 'strong';
  if (hasNum || hasUpper) return 'medium';
  return 'weak';
}

interface EditProfileSheetProps {
  profile: ParentProfile;
  onClose: () => void;
}

export const EditProfileSheet = memo(function EditProfileSheet({
  profile,
  onClose,
}: EditProfileSheetProps) {
  const theme = useTheme();
  const { t: i18n } = useTranslation('parent');
  const { t: i18nCommon } = useTranslation('common');
  const insets = useSafeAreaInsets();
  const session = useSession();
  const userId = session?.user.id ?? '';

  const profileSchema = useMemo(
    () =>
      z.object({
        first_name: z.string().min(2, i18n('edit_profile_name_min')),
        last_name: z.string().min(2, i18n('edit_profile_name_min')),
        phone: z.string().min(10, i18n('edit_profile_phone_invalid')),
      }),
    [i18n]
  );

  const passwordSchema = useMemo(
    () =>
      z
        .object({
          new_password: z.string().min(8, i18n('edit_profile_password_min')),
          confirm_password: z.string(),
        })
        .refine(d => d.new_password === d.confirm_password, {
          message: i18n('edit_profile_passwords_mismatch'),
          path: ['confirm_password'],
        }),
    [i18n]
  );

  const [tab, setTab] = useState<Tab>('info');
  const [avatarUri, setAvatarUri] = useState<string | null>(profile.avatar_url);
  const [pickerVisible, setPickerVisible] = useState(false);

  const updateProfile = useUpdateProfile();
  const updateAvatar = useUpdateAvatar();
  const changePassword = useChangePassword();
  const { pickFromGallery, takePhoto, isUploading } = useUploadImage({
    bucket: 'profile-images',
    userId,
  });

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: profile.first_name,
      last_name: profile.last_name,
      phone: profile.phone ?? '',
    },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { new_password: '', confirm_password: '' },
  });

  const newPasswordValue = passwordForm.watch('new_password');
  const strength = passwordStrength(newPasswordValue);

  const handleSaveInfo = useCallback(
    async (data: ProfileForm) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await updateProfile.mutateAsync(data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    },
    [updateProfile, onClose]
  );

  const handleSavePassword = useCallback(
    async (data: PasswordForm) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await changePassword.mutateAsync(data.new_password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      passwordForm.reset();
      onClose();
    },
    [changePassword, passwordForm, onClose]
  );

  const upload = useCallback(
    async (
      picker: () => Promise<{ signedUrl: string; filePath: string } | null>
    ) => {
      const result = await picker();
      if (!result) return;
      setAvatarUri(result.signedUrl);
      try {
        await updateAvatar.mutateAsync(result.signedUrl);
      } catch {
        Toast.show(i18n('edit_profile_photo_save_error'), {
          type: 'error',
          duration: 3000,
        });
      }
    },
    [updateAvatar]
  );

  const handleRemovePhoto = useCallback(async () => {
    setAvatarUri(null);
    try {
      await updateAvatar.mutateAsync('');
    } catch {
      Toast.show(i18n('edit_profile_photo_remove_error'), {
        type: 'error',
        duration: 3000,
      });
    }
  }, [updateAvatar]);

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
          {i18n('edit_profile_title')}
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

      {/* Avatar */}
      <Animated.View
        entering={FadeInDown.duration(300)}
        style={{ alignItems: 'center', paddingVertical: 20 }}
      >
        <TouchableOpacity
          onPress={() => setPickerVisible(true)}
          disabled={isUploading || updateAvatar.isPending}
        >
          <Avatar
            image={{
              uri: avatarUri ?? '',
              name: `${profile.first_name} ${profile.last_name}`,
            }}
            size={88}
            showBorder={false}
            backgroundColor={theme.accentBg}
            textColor={theme.accent}
            loading={isUploading || updateAvatar.isPending}
          />
          <View
            style={{
              position: 'absolute',
              bottom: -4,
              right: -4,
              width: 30,
              height: 30,
              borderRadius: 10,
              backgroundColor: theme.accent,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: theme.bg,
            }}
          >
            <Ionicons name="checkmark" size={14} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 12 }}>
          {i18n('edit_profile_tap_photo')}
        </Text>
      </Animated.View>

      <AvatarPickerSheet
        visible={pickerVisible}
        hasPhoto={!!avatarUri}
        onCamera={() => upload(takePhoto)}
        onGallery={() => upload(pickFromGallery)}
        onRemove={handleRemovePhoto}
        onClose={() => setPickerVisible(false)}
      />

      {/* Tabs */}
      <View
        style={{
          flexDirection: 'row',
          marginHorizontal: 20,
          backgroundColor: theme.iconBg,
          borderRadius: 14,
          padding: 4,
          marginBottom: 20,
        }}
      >
        {(['info', 'password'] as Tab[]).map(t => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 11,
              backgroundColor: tab === t ? theme.card : 'transparent',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '700',
                color: tab === t ? theme.text : theme.textMuted,
              }}
            >
              {t === 'info'
                ? i18n('edit_profile_tab_info')
                : i18n('edit_profile_tab_password')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={20}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 24,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {tab === 'info' ? (
            <Animated.View entering={FadeInDown.duration(250)}>
              <AuthInputField
                control={profileForm.control}
                name="first_name"
                label={i18n('edit_child_first_name')}
                icon={
                  <Ionicons
                    name="person-outline"
                    size={16}
                    color={theme.textMuted}
                  />
                }
                placeholder={i18n('edit_profile_first_name_placeholder')}
                error={profileForm.formState.errors.first_name?.message}
              />
              <AuthInputField
                control={profileForm.control}
                name="last_name"
                label={i18n('edit_child_last_name')}
                icon={
                  <Ionicons
                    name="person-outline"
                    size={16}
                    color={theme.textMuted}
                  />
                }
                placeholder={i18n('edit_profile_last_name_placeholder')}
                error={profileForm.formState.errors.last_name?.message}
              />
              <AuthInputField
                control={profileForm.control}
                name="phone"
                label={i18nCommon('phone')}
                icon={
                  <Ionicons
                    name="call-outline"
                    size={16}
                    color={theme.textMuted}
                  />
                }
                placeholder={i18n('edit_profile_phone_placeholder')}
                keyboardType="phone-pad"
                error={profileForm.formState.errors.phone?.message}
              />

              <SaveButton
                onPress={profileForm.handleSubmit(handleSaveInfo)}
                isLoading={updateProfile.isPending}
                label={i18n('edit_profile_save')}
                theme={theme}
              />
              {updateProfile.isError && (
                <Text
                  style={{
                    color: theme.red,
                    fontSize: 13,
                    textAlign: 'center',
                    marginTop: 8,
                  }}
                >
                  {i18n('edit_profile_save_error')}
                </Text>
              )}
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInDown.duration(250)}>
              <AuthPasswordField
                control={passwordForm.control}
                name="new_password"
                label={i18n('edit_profile_new_password')}
                error={passwordForm.formState.errors.new_password?.message}
              />
              {newPasswordValue.length > 0 && (
                <PasswordStrengthBar strength={strength} />
              )}
              <AuthPasswordField
                control={passwordForm.control}
                name="confirm_password"
                label={i18n('edit_profile_confirm_password')}
                error={passwordForm.formState.errors.confirm_password?.message}
              />

              <SaveButton
                onPress={passwordForm.handleSubmit(handleSavePassword)}
                isLoading={changePassword.isPending}
                label={i18n('edit_profile_update_password')}
                theme={theme}
              />
              {changePassword.isError && (
                <Text
                  style={{
                    color: theme.red,
                    fontSize: 13,
                    textAlign: 'center',
                    marginTop: 8,
                  }}
                >
                  {i18n('edit_profile_password_error')}
                </Text>
              )}
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
});

const SaveButton = memo(function SaveButton({
  onPress,
  isLoading,
  label = 'Enregistrer',
  theme,
}: {
  onPress: () => void;
  isLoading: boolean;
  label?: string;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <TouchableOpacity
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      disabled={isLoading}
      style={{
        backgroundColor: theme.accent,
        borderRadius: 18,
        paddingVertical: 16,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginTop: 8,
        opacity: isLoading ? 0.6 : 1,
      }}
    >
      {isLoading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <>
          <Ionicons name="checkmark" size={18} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
});
