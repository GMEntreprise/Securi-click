import { useSession } from '@/features/auth/store/auth.store';
import { useLocalSecurity } from '@/features/auth/hooks/useLocalSecurity';
import { EditProfileSheet } from '@/features/parent/components/ui/EditProfileSheet';
import {
  useParentProfile,
  useUpdateAvatar,
} from '@/features/parent/hooks/useParentProfile';
import { useUploadImage } from '@/features/parent/hooks/useUploadImage';
import { Avatar } from '@/shared/ui/base/avatar';
import { AvatarPickerSheet } from '@/shared/ui/molecules/AvatarPickerSheet';
import { Toast } from '@/shared/ui/molecules/Toast';
import { GooeySwitch } from '@/shared/ui/micro-interactions/gooey-switch';
import { useTheme as useThemeSwitcher } from '@/shared/ui/organisms/theme-switch/hooks';
import { useTheme } from '@/theme';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { RateAppRow } from '@/features/settings/components/RateAppRow';
import { useAppNavigation } from '@/navigation/useAppNavigation';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SheetModal } from '@/shared/ui/molecules/SheetModal';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

interface RowItem {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle?: string;
  toggle?: boolean;
  value?: boolean;
  disabled?: boolean;
  onToggle?: (v: boolean) => void;
  onPress: () => void;
  destructive?: boolean;
  customRight?: React.ReactNode;
}

const SettingRow = React.memo(function SettingRow({
  item,
  isLast,
}: {
  item: RowItem;
  isLast: boolean;
}) {
  const theme = useTheme();
  return (
    <TouchableOpacity
      onPress={() => {
        if (!item.toggle && !item.customRight) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          item.onPress();
        }
      }}
      activeOpacity={item.toggle || item.customRight ? 1 : 0.7}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 13,
        paddingHorizontal: 16,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: theme.separator,
      }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 11,
          backgroundColor: item.destructive ? theme.redBg : item.iconBg,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        {item.icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: item.destructive ? theme.red : theme.text,
            fontSize: 15,
            fontWeight: '600',
          }}
        >
          {item.title}
        </Text>
        {item.subtitle && (
          <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 1 }}>
            {item.subtitle}
          </Text>
        )}
      </View>
      {item.customRight ? (
        item.customRight
      ) : item.toggle ? (
        <Switch
          value={item.value}
          disabled={item.disabled}
          onValueChange={v => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            item.onToggle?.(v);
          }}
          trackColor={{
            false: theme.switchTrackOff,
            true: theme.switchTrackOn,
          }}
          thumbColor="#ffffff"
          ios_backgroundColor={theme.switchTrackOff}
        />
      ) : (
        <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
      )}
    </TouchableOpacity>
  );
});

export default function ProfileScreen() {
  const nav = useAppNavigation();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { t: i18n } = useTranslation('parent');
  const session = useSession();
  const { isDark, toggleTheme } = useThemeSwitcher();

  const [editSheetVisible, setEditSheetVisible] = useState(false);
  const [avatarPickerVisible, setAvatarPickerVisible] = useState(false);

  const {
    isEnabled: biometricEnabled,
    isMutating: biometricMutating,
    enable: enableBiometric,
    disable: disableBiometric,
  } = useLocalSecurity();

  const { data: profile } = useParentProfile();
  const updateAvatar = useUpdateAvatar();
  const { pickFromGallery, takePhoto, isUploading } = useUploadImage({
    bucket: 'profile-images',
    userId: session?.user.id ?? '',
  });

  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);
  const avatarUri = localAvatarUri ?? profile?.avatar_url ?? null;

  const uploadAvatar = useCallback(
    async (picker: () => Promise<{ signedUrl: string } | null>) => {
      const result = await picker();
      if (!result) return;
      setLocalAvatarUri(result.signedUrl);
      try {
        await updateAvatar.mutateAsync(result.signedUrl);
      } catch {
        Toast.show(i18n('profile_photo_error'), {
          type: 'error',
          duration: 3000,
        });
      }
    },
    [updateAvatar]
  );

  const handleRemoveAvatar = useCallback(async () => {
    setLocalAvatarUri('');
    try {
      await updateAvatar.mutateAsync('');
    } catch {
      Toast.show(i18n('profile_photo_remove_error'), {
        type: 'error',
        duration: 3000,
      });
    }
  }, [updateAvatar]);

  const firstName =
    profile?.first_name ??
    session?.user.profile?.first_name ??
    session?.user.email?.split('@')[0] ??
    '';
  const lastName = profile?.last_name ?? session?.user.profile?.last_name ?? '';
  const email = session?.user.email ?? '';
  const phone = profile?.phone ?? session?.user.profile?.phone ?? '';

  const handleBiometricToggle = useCallback(
    async (value: boolean) => {
      if (value) await enableBiometric();
      else await disableBiometric();
    },
    [enableBiometric, disableBiometric]
  );

  const handleLogout = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(i18n('profile_logout_title'), i18n('profile_logout_confirm'), [
      { text: i18n('guardian_add_relation_cancel'), style: 'cancel' },
      {
        text: i18n('profile_logout_btn'),
        style: 'destructive',
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          await nav.logout();
        },
      },
    ]);
  }, [nav, i18n]);

  const darkModeSwitch = useMemo(
    () => (
      <GooeySwitch
        active={isDark}
        onToggle={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          toggleTheme({
            animationType: 'circular' as any,
            animationDuration: 500,
          });
        }}
        size={64}
        activeColor={theme.primary}
        inactiveColor={theme.accent}
        trackColor={isDark ? '#30363d' : '#e2e8f0'}
      />
    ),
    [isDark, toggleTheme, theme]
  );

  const sections = useMemo(
    () => [
      {
        title: i18n('profile_section_account'),
        items: [
          {
            icon: (
              <Ionicons name="person-outline" size={16} color={theme.primary} />
            ),
            iconBg: theme.primaryBg,
            title: i18n('profile_personal_info'),
            subtitle: i18n('profile_personal_info_subtitle'),
            onPress: () => setEditSheetVisible(true),
          },
          {
            icon: (
              <Ionicons
                name="shield-checkmark-outline"
                size={16}
                color={theme.accent}
              />
            ),
            iconBg: theme.accentBg,
            title: i18n('profile_security'),
            subtitle: i18n('profile_security_subtitle'),
            onPress: () => nav.goToParentSecurity(),
          },
        ] as RowItem[],
      },
      {
        title: i18n('profile_section_preferences'),
        items: [
          {
            icon: (
              <Ionicons
                name="moon-outline"
                size={16}
                color={theme.textSecondary}
              />
            ),
            iconBg: theme.iconBg,
            title: i18n('profile_dark_mode'),
            subtitle: isDark
              ? i18n('profile_dark_mode_on')
              : i18n('profile_dark_mode_off'),
            customRight: darkModeSwitch,
            onPress: () => {},
          },
          {
            icon: (
              <Ionicons
                name="notifications-outline"
                size={16}
                color={theme.green}
              />
            ),
            iconBg: theme.greenBg,
            title: i18n('profile_notifications'),
            subtitle: i18n('profile_notifications_subtitle'),
            onPress: () => nav.goToParentNotifications(),
          },
          {
            icon: (
              <Ionicons
                name="phone-portrait-outline"
                size={16}
                color="#6366f1"
              />
            ),
            iconBg: 'rgba(99,102,241,0.1)',
            title: i18n('profile_biometric'),
            subtitle: biometricEnabled
              ? i18n('profile_biometric_on')
              : i18n('profile_biometric_off'),
            toggle: true,
            value: biometricEnabled,
            disabled: biometricMutating,
            onToggle: handleBiometricToggle,
            onPress: () => nav.goToParentSecurity(),
          },
        ] as RowItem[],
      },
      {
        title: i18n('profile_section_support'),
        items: [
          {
            icon: (
              <Ionicons
                name="help-circle-outline"
                size={16}
                color={theme.amber}
              />
            ),
            iconBg: theme.amberBg,
            title: i18n('profile_faq'),
            onPress: () => nav.goToParentFaq(),
          },
          {
            icon: (
              <Ionicons
                name="document-text-outline"
                size={16}
                color={theme.textMuted}
              />
            ),
            iconBg: theme.iconBg,
            title: i18n('profile_legal'),
            onPress: () => nav.goToParentLegalMentions(),
          },
          {
            icon: (
              <Ionicons
                name="lock-closed-outline"
                size={16}
                color={theme.textMuted}
              />
            ),
            iconBg: theme.iconBg,
            title: i18n('profile_privacy'),
            onPress: () => nav.goToParentPrivacyPolicy(),
          },
        ] as RowItem[],
      },
    ],
    [
      biometricEnabled,
      handleBiometricToggle,
      theme,
      isDark,
      darkModeSwitch,
      nav,
      i18n,
    ]
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingTop: insets.top + 20, paddingHorizontal: 20 }}>
          {/* Profile card */}
          <Animated.View
            entering={FadeInDown.duration(400)}
            style={{
              backgroundColor: theme.card,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: theme.cardBorder,
              padding: 20,
              marginBottom: 24,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setAvatarPickerVisible(true);
                }}
                style={{ marginRight: 16 }}
                activeOpacity={0.8}
              >
                <Avatar
                  image={{
                    uri: avatarUri ?? '',
                    name: `${firstName} ${lastName}`.trim(),
                  }}
                  size={64}
                  showBorder={false}
                  backgroundColor={theme.accentBg}
                  textColor={theme.accent}
                  loading={!profile || isUploading || updateAvatar.isPending}
                />
                <View
                  style={{
                    position: 'absolute',
                    bottom: -2,
                    right: -2,
                    width: 22,
                    height: 22,
                    borderRadius: 7,
                    backgroundColor: theme.accent,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: theme.card,
                  }}
                >
                  <Ionicons name="pencil-outline" size={10} color="#fff" />
                </View>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ color: theme.text, fontSize: 18, fontWeight: '800' }}
                >
                  {firstName} {lastName}
                </Text>
                {email ? (
                  <Text
                    style={{
                      color: theme.textSecondary,
                      fontSize: 13,
                      marginTop: 2,
                    }}
                  >
                    {email}
                  </Text>
                ) : null}
                {phone ? (
                  <Text
                    style={{
                      color: theme.textMuted,
                      fontSize: 12,
                      marginTop: 1,
                    }}
                  >
                    {phone}
                  </Text>
                ) : null}
              </View>
            </View>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setEditSheetVisible(true);
              }}
              style={{
                backgroundColor: theme.profileEditBg,
                borderRadius: 12,
                paddingVertical: 10,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Ionicons
                name="pencil-outline"
                size={14}
                color={theme.textSecondary}
              />
              <Text
                style={{ color: theme.text, fontWeight: '600', fontSize: 14 }}
              >
                {i18n('profile_edit')}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Sections */}
          {sections.map((section, si) => (
            <Animated.View
              key={section.title}
              entering={FadeInDown.delay(si * 80).duration(400)}
              style={{ marginBottom: 20 }}
            >
              <Text
                style={{
                  color: theme.textMuted,
                  fontSize: 11,
                  fontWeight: '700',
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  marginBottom: 8,
                  marginLeft: 4,
                }}
              >
                {section.title}
              </Text>
              <View
                style={{
                  backgroundColor: theme.card,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: theme.cardBorder,
                  overflow: 'hidden',
                }}
              >
                {section.items.map((item, ii) => (
                  <SettingRow
                    key={item.title}
                    item={item}
                    isLast={ii === section.items.length - 1}
                  />
                ))}
              </View>
            </Animated.View>
          ))}

          {/* Rate app */}
          <Animated.View
            entering={FadeInDown.delay(300).duration(400)}
            style={{ marginBottom: 20 }}
          >
            <Text
              style={{
                color: theme.textMuted,
                fontSize: 11,
                fontWeight: '700',
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                marginBottom: 8,
                marginLeft: 4,
              }}
            >
              {i18n('profile_section_app')}
            </Text>
            <View
              style={{
                backgroundColor: theme.card,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: theme.cardBorder,
                overflow: 'hidden',
              }}
            >
              <RateAppRow isLast />
            </View>
          </Animated.View>

          {/* Logout */}
          <Animated.View
            entering={FadeInDown.delay(360).duration(400)}
            style={{ marginBottom: 8 }}
          >
            <TouchableOpacity
              onPress={handleLogout}
              style={{
                backgroundColor: theme.card,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: 'rgba(239,68,68,0.2)',
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Ionicons name="log-out-outline" size={18} color={theme.red} />
              <Text
                style={{ color: theme.red, fontWeight: '700', fontSize: 15 }}
              >
                {i18n('profile_logout')}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>

      <SheetModal
        visible={editSheetVisible}
        onRequestClose={() => setEditSheetVisible(false)}
      >
        {profile ? (
          <EditProfileSheet
            profile={profile}
            onClose={() => setEditSheetVisible(false)}
          />
        ) : (
          <View style={{ flex: 1, backgroundColor: theme.bg }} />
        )}
      </SheetModal>

      <AvatarPickerSheet
        visible={avatarPickerVisible}
        hasPhoto={!!avatarUri}
        onCamera={() => uploadAvatar(takePhoto)}
        onGallery={() => uploadAvatar(pickFromGallery)}
        onRemove={handleRemoveAvatar}
        onClose={() => setAvatarPickerVisible(false)}
      />
    </View>
  );
}
