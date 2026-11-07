import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SheetModal } from '@/shared/ui/molecules/SheetModal';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RateAppRow } from '@/features/settings/components/RateAppRow';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { appLocale } from '@/i18n/locale';
import { useTheme as useThemeSwitcher } from '@/shared/ui/organisms/theme-switch/hooks';
import { GooeySwitch } from '@/shared/ui/micro-interactions/gooey-switch';
import { useAppNavigation } from '@/navigation/useAppNavigation';
import { useSession } from '@/features/auth/store/auth.store';
import { useUnreadCount } from '@/features/notifications/stores/notification.store';
import {
  useCollectorProfile,
  useMyIdentity,
  useUpdateCollectorAvatarUrl,
} from '@/features/collector/hooks/useCollector';
import { useImagePicker } from '@/hooks';
import { EditCollectorSheet } from '@/features/collector/components/ui/EditCollectorSheet';
import { AvatarPickerSheet } from '@/shared/ui/molecules/AvatarPickerSheet';
import { Toast } from '@/shared/ui/molecules/Toast';
import IdentityVerificationSheet from './IdentityVerificationSheet';
import { Avatar } from '@/shared/ui/base/avatar';

const IDENTITY_CFG = {
  verified: {
    labelKey: 'identity_badge_verified',
    subKey: 'identity_sub_verified',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.14)',
    border: 'rgba(16,185,129,0.28)',
    iconName: 'shield-checkmark' as const,
  },
  pending: {
    labelKey: 'identity_badge_pending',
    subKey: 'identity_sub_pending',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.14)',
    border: 'rgba(245,158,11,0.28)',
    iconName: 'time' as const,
  },
  refused: {
    labelKey: 'identity_badge_refused',
    subKey: 'identity_sub_refused',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.14)',
    border: 'rgba(239,68,68,0.28)',
    iconName: 'shield-outline' as const,
  },
  expired: {
    labelKey: 'identity_badge_expired',
    subKey: 'identity_sub_expired',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.14)',
    border: 'rgba(239,68,68,0.28)',
    iconName: 'shield-outline' as const,
  },
  none: {
    labelKey: 'identity_badge_none',
    subKey: 'identity_sub_none',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.14)',
    border: 'rgba(245,158,11,0.28)',
    iconName: 'warning' as const,
  },
} as const;

export default function CollectorProfileScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useTranslation('collector');
  const nav = useAppNavigation();
  const unreadCount = useUnreadCount();

  const { isDark, toggleTheme } = useThemeSwitcher();
  const { data: profile, isLoading } = useCollectorProfile();
  const { data: identity } = useMyIdentity();

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

  const [showEditSheet, setShowEditSheet] = useState(false);
  const [showIdentitySheet, setShowIdentitySheet] = useState(false);
  const [avatarPickerVisible, setAvatarPickerVisible] = useState(false);
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);

  const session = useSession();
  const updateAvatarUrl = useUpdateCollectorAvatarUrl();
  const { pickFromGallery, takePhoto, isUploading } = useImagePicker({
    bucket: 'collector-avatars',
    userId: session?.user.id ?? '',
  });

  const avatarUri = localAvatarUri ?? profile?.avatar_url ?? null;

  const uploadAvatar = useCallback(
    async (picker: () => Promise<{ signedUrl: string } | null>) => {
      const result = await picker();
      if (!result) return;
      setLocalAvatarUri(result.signedUrl);
      try {
        await updateAvatarUrl.mutateAsync(result.signedUrl);
      } catch {
        Toast.show(t('profile_photo_save_error'), {
          type: 'error',
          duration: 3000,
        });
      }
    },
    [updateAvatarUrl, t]
  );

  const handleRemoveAvatar = useCallback(async () => {
    setLocalAvatarUri('');
    try {
      await updateAvatarUrl.mutateAsync('');
    } catch {
      Toast.show(t('profile_photo_remove_error'), {
        type: 'error',
        duration: 3000,
      });
    }
  }, [updateAvatarUrl, t]);

  const handleLogout = useCallback(() => {
    Alert.alert(t('profile_logout_title'), t('profile_logout_body'), [
      { text: t('common:cancel'), style: 'cancel' },
      {
        text: t('profile_logout_confirm'),
        style: 'destructive',
        onPress: async () => {
          await nav.logout();
        },
      },
    ]);
  }, [nav, t]);

  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(t('auth:security_delete_title'), t('profile_delete_body'), [
      { text: t('common:cancel'), style: 'cancel' },
      {
        text: t('auth:security_delete_confirm'),
        style: 'destructive',
        onPress: async () => {
          setIsDeleting(true);
          try {
            await nav.deleteAccount();
          } catch {
            setIsDeleting(false);
            Alert.alert(t('common:error'), t('auth:security_delete_error'));
          }
        },
      },
    ]);
  }, [nav, t]);

  const status = identity?.verification_status ?? 'none';
  const idCfg =
    IDENTITY_CFG[status as keyof typeof IDENTITY_CFG] ?? IDENTITY_CFG.none;
  const isAvatarBusy = !profile || isUploading || updateAvatarUrl.isPending;

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  const fullName =
    `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim();

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.bg }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero header avec gradient */}
        <Animated.View entering={FadeInDown.duration(450)}>
          <LinearGradient
            colors={
              isDark
                ? [
                    'rgba(249,115,22,0.22)',
                    'rgba(249,115,22,0.06)',
                    'transparent',
                  ]
                : [
                    'rgba(249,115,22,0.14)',
                    'rgba(249,115,22,0.04)',
                    'transparent',
                  ]
            }
            locations={[0, 0.55, 1]}
            style={{
              paddingTop: insets.top + 28,
              paddingBottom: 32,
              paddingHorizontal: 24,
              alignItems: 'center',
            }}
          >
            {/* Avatar */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setAvatarPickerVisible(true);
              }}
              activeOpacity={0.85}
              style={{ marginBottom: 16 }}
            >
              <View
                style={{
                  width: 96,
                  height: 96,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Avatar
                  image={{ uri: avatarUri ?? '', name: fullName }}
                  size={96}
                  showBorder={false}
                  backgroundColor={theme.accentBg}
                  textColor={theme.accent}
                  loading={isAvatarBusy}
                />
                <View
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 30,
                    height: 30,
                    borderRadius: 10,
                    backgroundColor: theme.accent,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2.5,
                    borderColor: theme.bg,
                  }}
                >
                  <Ionicons name="camera-outline" size={13} color="#fff" />
                </View>
              </View>
            </TouchableOpacity>

            {/* Nom + rôle */}
            <Text
              style={{
                color: theme.text,
                fontSize: 24,
                fontWeight: '800',
                letterSpacing: -0.3,
                textAlign: 'center',
              }}
            >
              {fullName || '—'}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                marginTop: 6,
                backgroundColor: theme.accentBg,
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 12,
              }}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={12}
                color={theme.accent}
              />
              <Text
                style={{ color: theme.accent, fontSize: 12, fontWeight: '700' }}
              >
                {t('profile_role')}
              </Text>
            </View>

            {/* Bouton modifier */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowEditSheet(true);
              }}
              style={{
                marginTop: 16,
                backgroundColor: theme.card,
                borderRadius: 14,
                paddingVertical: 10,
                paddingHorizontal: 20,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 7,
                borderWidth: 1,
                borderColor: theme.cardBorder,
              }}
            >
              <Ionicons
                name="pencil-outline"
                size={13}
                color={theme.textSecondary}
              />
              <Text
                style={{ color: theme.text, fontWeight: '600', fontSize: 14 }}
              >
                {t('profile_edit')}
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>

        <View style={{ paddingHorizontal: 20, gap: 12 }}>
          {/* Bandeau identité */}
          <Animated.View entering={FadeInDown.delay(80).duration(350)}>
            <TouchableOpacity
              onPress={() => setShowIdentitySheet(true)}
              activeOpacity={0.8}
              style={{
                backgroundColor: idCfg.bg,
                borderRadius: 20,
                borderWidth: 1.5,
                borderColor: idCfg.border,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 15,
                  backgroundColor: `${idCfg.color}22`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name={idCfg.iconName} size={22} color={idCfg.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: idCfg.color,
                    fontSize: 14,
                    fontWeight: '800',
                  }}
                >
                  {t(idCfg.labelKey)}
                </Text>
                <Text
                  style={{
                    color: idCfg.color,
                    fontSize: 12,
                    opacity: 0.75,
                    marginTop: 2,
                  }}
                >
                  {identity?.verified_at
                    ? t('identity_verified_on', {
                        date: new Date(identity.verified_at).toLocaleDateString(
                          appLocale()
                        ),
                      })
                    : t(idCfg.subKey)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={idCfg.color} />
            </TouchableOpacity>
          </Animated.View>

          {/* Infos profil */}
          <Animated.View entering={FadeInDown.delay(130).duration(350)}>
            <SectionLabel label={t('profile_info')} />
            <View
              style={{
                backgroundColor: theme.card,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: theme.cardBorder,
                overflow: 'hidden',
              }}
            >
              <InfoRow
                iconName="person-outline"
                label={t('common:first_name')}
                value={profile?.first_name ?? '—'}
              />
              <InfoRow
                iconName="person-outline"
                label={t('common:last_name')}
                value={profile?.last_name ?? '—'}
              />
              <InfoRow
                iconName="call-outline"
                label={t('common:phone')}
                value={profile?.phone ?? '—'}
                isLast
              />
            </View>
          </Animated.View>

          {/* Pièce d'identité */}
          <Animated.View entering={FadeInDown.delay(160).duration(350)}>
            <TouchableOpacity
              onPress={() => setShowIdentitySheet(true)}
              activeOpacity={0.8}
              style={{
                backgroundColor: theme.card,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: theme.cardBorder,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 13,
                  backgroundColor: theme.accentBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="card-outline" size={19} color={theme.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ color: theme.text, fontWeight: '700', fontSize: 15 }}
                >
                  {t('profile_id_document')}
                </Text>
                <Text
                  style={{ color: theme.textMuted, fontSize: 12, marginTop: 1 }}
                >
                  {status === 'verified'
                    ? t('profile_id_verified_hint')
                    : t('identity_submit_review')}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={theme.textMuted}
              />
            </TouchableOpacity>
          </Animated.View>

          {/* Paramètres */}
          <Animated.View entering={FadeInDown.delay(190).duration(350)}>
            <SectionLabel label={t('profile_settings')} />
            <View
              style={{
                backgroundColor: theme.card,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: theme.cardBorder,
                overflow: 'hidden',
              }}
            >
              {/* Mode sombre */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  gap: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.separator,
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 11,
                    backgroundColor: isDark
                      ? 'rgba(99,102,241,0.14)'
                      : theme.iconBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons
                    name={isDark ? 'moon' : 'sunny-outline'}
                    size={17}
                    color={isDark ? '#818cf8' : theme.textSecondary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: theme.text,
                      fontWeight: '600',
                      fontSize: 15,
                    }}
                  >
                    {t('profile_dark_mode')}
                  </Text>
                  <Text
                    style={{
                      color: theme.textMuted,
                      fontSize: 12,
                      marginTop: 1,
                    }}
                  >
                    {isDark ? t('profile_on') : t('profile_off')}
                  </Text>
                </View>
                {darkModeSwitch}
              </View>

              {/* Notifications */}
              <TouchableOpacity
                onPress={() => nav.goToCollectorNotifications()}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 13,
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 11,
                    backgroundColor: theme.greenBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons
                    name="notifications-outline"
                    size={17}
                    color={theme.green}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: theme.text,
                      fontWeight: '600',
                      fontSize: 15,
                    }}
                  >
                    {t('profile_notifications')}
                  </Text>
                  <Text
                    style={{
                      color: theme.textMuted,
                      fontSize: 12,
                      marginTop: 1,
                    }}
                  >
                    {unreadCount > 0
                      ? t('profile_unread', { count: unreadCount })
                      : t('profile_no_unread')}
                  </Text>
                </View>
                {unreadCount > 0 && (
                  <View
                    style={{
                      backgroundColor: theme.red,
                      borderRadius: 10,
                      minWidth: 20,
                      height: 20,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 5,
                    }}
                  >
                    <Text
                      style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
                )}
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={theme.textMuted}
                />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Support & Légal */}
          <Animated.View entering={FadeInDown.delay(220).duration(350)}>
            <SectionLabel label={t('profile_support')} />
            <View
              style={{
                backgroundColor: theme.card,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: theme.cardBorder,
                overflow: 'hidden',
              }}
            >
              <NavRow
                iconName="help-circle-outline"
                iconBg={theme.amberBg}
                iconColor={theme.amber}
                label={t('common:screen_faq')}
                onPress={() => nav.goToCollectorFaq()}
              />
              <NavRow
                iconName="document-text-outline"
                iconBg={theme.iconBg}
                iconColor={theme.textMuted}
                label={t('common:screen_legal')}
                onPress={() => nav.goToCollectorLegalMentions()}
              />
              <NavRow
                iconName="lock-closed-outline"
                iconBg={theme.iconBg}
                iconColor={theme.textMuted}
                label={t('common:privacy')}
                onPress={() => nav.goToCollectorPrivacyPolicy()}
                isLast
              />
            </View>
          </Animated.View>

          {/* Application */}
          <Animated.View entering={FadeInDown.delay(250).duration(350)}>
            <SectionLabel label={t('profile_app')} />
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

          {/* Déconnexion */}
          <Animated.View
            entering={FadeInDown.delay(280).duration(350)}
            style={{ marginTop: 4 }}
          >
            <TouchableOpacity
              onPress={handleLogout}
              activeOpacity={0.8}
              style={{
                backgroundColor: theme.redBg,
                borderRadius: 20,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                borderWidth: 1,
                borderColor: 'rgba(239,68,68,0.2)',
              }}
            >
              <Ionicons name="log-out-outline" size={18} color={theme.red} />
              <Text
                style={{ color: theme.red, fontWeight: '700', fontSize: 15 }}
              >
                {t('profile_logout')}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Suppression de compte */}
          <Animated.View
            entering={FadeInDown.delay(310).duration(350)}
            style={{ marginTop: 8 }}
          >
            <TouchableOpacity
              onPress={handleDeleteAccount}
              disabled={isDeleting}
              activeOpacity={0.8}
              style={{
                borderRadius: 20,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                opacity: isDeleting ? 0.6 : 1,
              }}
            >
              {isDeleting ? (
                <ActivityIndicator color={theme.textMuted} size="small" />
              ) : (
                <Ionicons
                  name="trash-outline"
                  size={15}
                  color={theme.textMuted}
                />
              )}
              <Text
                style={{
                  color: theme.textMuted,
                  fontWeight: '600',
                  fontSize: 13,
                  textDecorationLine: 'underline',
                }}
              >
                {t('auth:security_delete_title')}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>

      <SheetModal
        visible={showEditSheet}
        onRequestClose={() => setShowEditSheet(false)}
      >
        {profile ? (
          <EditCollectorSheet
            profile={profile}
            onClose={() => setShowEditSheet(false)}
          />
        ) : (
          <View style={{ flex: 1, backgroundColor: theme.bg }} />
        )}
      </SheetModal>

      <IdentityVerificationSheet
        visible={showIdentitySheet}
        onClose={() => setShowIdentitySheet(false)}
        currentIdentity={identity}
      />

      <AvatarPickerSheet
        visible={avatarPickerVisible}
        hasPhoto={!!avatarUri}
        onCamera={() => uploadAvatar(takePhoto)}
        onGallery={() => uploadAvatar(pickFromGallery)}
        onRemove={handleRemoveAvatar}
        onClose={() => setAvatarPickerVisible(false)}
      />
    </>
  );
}

function SectionLabel({ label }: { label: string }) {
  const theme = useTheme();
  return (
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
      {label}
    </Text>
  );
}

function InfoRow({
  iconName,
  label,
  value,
  isLast = false,
}: {
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  isLast?: boolean;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 13,
        gap: 12,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: theme.separator,
      }}
    >
      <Ionicons name={iconName} size={15} color={theme.textMuted} />
      <View style={{ flex: 1 }}>
        <Text
          style={{ color: theme.textMuted, fontSize: 11, fontWeight: '600' }}
        >
          {label}
        </Text>
        <Text
          style={{
            color: theme.text,
            fontSize: 14,
            fontWeight: '500',
            marginTop: 1,
          }}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function NavRow({
  iconName,
  iconBg,
  iconColor,
  label,
  onPress,
  isLast = false,
}: {
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  iconBg: string;
  iconColor: string;
  label: string;
  onPress: () => void;
  isLast?: boolean;
}) {
  const theme = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 13,
        gap: 12,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: theme.separator,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 11,
          backgroundColor: iconBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={iconName} size={16} color={iconColor} />
      </View>
      <Text
        style={{ flex: 1, color: theme.text, fontWeight: '600', fontSize: 15 }}
      >
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
    </TouchableOpacity>
  );
}
