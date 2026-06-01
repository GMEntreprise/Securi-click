import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SheetModal } from '@/shared/ui/molecules/SheetModal';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { RateAppRow } from '@/features/settings/components/RateAppRow';
import { AvatarPickerSheet } from '@/shared/ui/molecules/AvatarPickerSheet';
import { useTheme } from '@/theme';
import { useAppNavigation } from '@/navigation/useAppNavigation';
import { useUnreadCount } from '@/features/notifications/stores/notification.store';
import {
  useMySchool,
  useUpdateSchoolLogo,
} from '@/features/school/hooks/useSchool';
import { useSession } from '@/features/auth/store/auth.store';
import { useImagePicker } from '@/hooks';
import { Avatar } from '@/shared/ui/base/avatar';
import { EditSchoolSheet } from '@/features/school/components/ui/EditSchoolSheet';
import { useTranslation } from 'react-i18next';
import { useLanguageStore } from '@/stores/language.store';

export default function SchoolProfileScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const nav = useAppNavigation();
  const { t: i18n } = useTranslation('school');
  const { language } = useLanguageStore();
  const unreadCount = useUnreadCount();
  const session = useSession();
  const userId = session?.user.id ?? '';

  const { data: school, isLoading } = useMySchool();
  const updateLogo = useUpdateSchoolLogo();
  const [showEditSheet, setShowEditSheet] = useState(false);

  const { pickFromGallery, takePhoto, isUploading } = useImagePicker({
    bucket: 'school-logos' as any,
    userId,
  });

  const [pickerVisible, setPickerVisible] = useState(false);

  const uploadLogo = useCallback(
    async (
      picker: () => Promise<{ signedUrl: string; filePath: string } | null>
    ) => {
      if (!school?.id) return;
      const result = await picker();
      if (!result) return;
      await updateLogo.mutateAsync({
        schoolId: school.id,
        logoUrl: result.signedUrl,
      });
    },
    [school?.id, updateLogo]
  );

  const handleRemoveLogo = useCallback(async () => {
    if (!school?.id) return;
    await updateLogo.mutateAsync({ schoolId: school.id, logoUrl: '' });
  }, [school?.id, updateLogo]);

  const handleLogout = useCallback(() => {
    Alert.alert(i18n('profile_logout_title'), i18n('profile_logout_confirm'), [
      { text: i18n('profile_logout_cancel'), style: 'cancel' },
      {
        text: i18n('profile_logout_btn'),
        style: 'destructive',
        onPress: () => nav.logout(),
      },
    ]);
  }, [nav, i18n]);

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

  const isLogoBusy = isUploading || updateLogo.isPending;

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.bg }}
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo + name */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={{ alignItems: 'center', marginBottom: 28 }}
        >
          <TouchableOpacity
            onPress={() => setPickerVisible(true)}
            disabled={isLogoBusy}
            style={{ marginBottom: 14 }}
          >
            <Avatar
              image={{
                uri: school?.logo_url ?? '',
                name: school?.name ?? '',
              }}
              size={90}
              showBorder={false}
              backgroundColor={theme.primaryBg}
              textColor={theme.primary}
              loading={isLogoBusy}
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
              <Ionicons name="pencil-outline" size={12} color="#fff" />
            </View>
          </TouchableOpacity>

          <AvatarPickerSheet
            visible={pickerVisible}
            hasPhoto={!!school?.logo_url}
            onCamera={() => uploadLogo(takePhoto)}
            onGallery={() => uploadLogo(pickFromGallery)}
            onRemove={handleRemoveLogo}
            onClose={() => setPickerVisible(false)}
          />

          <Text
            style={{
              color: theme.text,
              fontSize: 22,
              fontWeight: '800',
              textAlign: 'center',
            }}
          >
            {school?.name}
          </Text>
          <Text style={{ color: theme.textMuted, fontSize: 13, marginTop: 4 }}>
            {school?.type}
          </Text>

          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowEditSheet(true);
            }}
            style={{
              marginTop: 14,
              backgroundColor: theme.profileEditBg,
              borderRadius: 12,
              paddingVertical: 9,
              paddingHorizontal: 18,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
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
              {i18n('profile_edit_school')}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Info card */}
        <Animated.View
          entering={FadeInDown.delay(60).duration(350)}
          style={{ marginBottom: 20 }}
        >
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
              iconName="business-outline"
              label={i18n('profile_info_manager')}
              value={`${school?.manager_first_name ?? ''} ${school?.manager_last_name ?? ''}`.trim()}
            />
            <InfoRow
              iconName="mail-outline"
              label={i18n('profile_info_email')}
              value={school?.email ?? '—'}
            />
            <InfoRow
              iconName="call-outline"
              label={i18n('profile_info_phone')}
              value={school?.phone ?? '—'}
            />
            <InfoRow
              iconName="location-outline"
              label={i18n('profile_info_address')}
              value={
                school
                  ? `${school.address}, ${school.postal_code} ${school.city}`
                  : '—'
              }
              isLast
            />
          </View>
        </Animated.View>

        {/* Notifications */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(350)}
          style={{ marginBottom: 16 }}
        >
          <TouchableOpacity
            onPress={() => nav.goToSchoolNotifications()}
            style={{
              backgroundColor: theme.card,
              borderRadius: 18,
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
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: theme.greenBg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons
                name="notifications-outline"
                size={18}
                color={theme.green}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{ color: theme.text, fontWeight: '700', fontSize: 15 }}
              >
                {i18n('profile_notifications_label')}
              </Text>
              <Text
                style={{ color: theme.textMuted, fontSize: 12, marginTop: 1 }}
              >
                {unreadCount > 0
                  ? i18n(
                      unreadCount > 1
                        ? 'profile_notifications_unread_other'
                        : 'profile_notifications_unread_one',
                      { count: unreadCount }
                    )
                  : i18n('profile_notifications_none')}
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
        </Animated.View>

        {/* Sécurité */}
        <Animated.View
          entering={FadeInDown.delay(105).duration(350)}
          style={{ marginBottom: 16 }}
        >
          <TouchableOpacity
            onPress={() => nav.goToSchoolSecurity()}
            style={{
              backgroundColor: theme.card,
              borderRadius: 18,
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
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: theme.accentBg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={18}
                color={theme.accent}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{ color: theme.text, fontWeight: '700', fontSize: 15 }}
              >
                {i18n('profile_security_label')}
              </Text>
              <Text
                style={{ color: theme.textMuted, fontSize: 12, marginTop: 1 }}
              >
                {i18n('profile_security_subtitle')}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={theme.textMuted}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Langue */}
        <Animated.View
          entering={FadeInDown.delay(108).duration(350)}
          style={{ marginBottom: 16 }}
        >
          <TouchableOpacity
            onPress={() => nav.goToSchoolLanguage()}
            style={{
              backgroundColor: theme.card,
              borderRadius: 18,
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
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: theme.primaryBg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons
                name="language-outline"
                size={18}
                color={theme.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{ color: theme.text, fontWeight: '700', fontSize: 15 }}
              >
                {i18n('profile_language')}
              </Text>
              <Text
                style={{ color: theme.textMuted, fontSize: 12, marginTop: 1 }}
              >
                {language === 'fr' ? '🇫🇷 Français' : '🇬🇧 English'}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={theme.textMuted}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Support & Légal */}
        <Animated.View
          entering={FadeInDown.delay(110).duration(350)}
          style={{ marginBottom: 16 }}
        >
          <View
            style={{
              backgroundColor: theme.card,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: theme.cardBorder,
              overflow: 'hidden',
            }}
          >
            <TouchableOpacity
              onPress={() => nav.goToSchoolFaq()}
              style={{
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
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
                  backgroundColor: theme.amberBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name="help-circle-outline"
                  size={16}
                  color={theme.amber}
                />
              </View>
              <Text
                style={{
                  flex: 1,
                  color: theme.text,
                  fontWeight: '600',
                  fontSize: 15,
                }}
              >
                {i18n('profile_faq')}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={theme.textMuted}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => nav.goToSchoolLegalMentions()}
              style={{
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
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
                  backgroundColor: theme.iconBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name="document-text-outline"
                  size={16}
                  color={theme.textMuted}
                />
              </View>
              <Text
                style={{
                  flex: 1,
                  color: theme.text,
                  fontWeight: '600',
                  fontSize: 15,
                }}
              >
                {i18n('profile_legal')}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={theme.textMuted}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => nav.goToSchoolPrivacyPolicy()}
              style={{
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 11,
                  backgroundColor: theme.iconBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={16}
                  color={theme.textMuted}
                />
              </View>
              <Text
                style={{
                  flex: 1,
                  color: theme.text,
                  fontWeight: '600',
                  fontSize: 15,
                }}
              >
                {i18n('profile_privacy')}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={theme.textMuted}
              />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Rate app */}
        <Animated.View
          entering={FadeInDown.delay(125).duration(350)}
          style={{ marginBottom: 16 }}
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
            {i18n('profile_app_section')}
          </Text>
          <View
            style={{
              backgroundColor: theme.card,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: theme.cardBorder,
              overflow: 'hidden',
            }}
          >
            <RateAppRow isLast />
          </View>
        </Animated.View>

        {/* Logout */}
        <Animated.View entering={FadeInDown.delay(155).duration(350)}>
          <TouchableOpacity
            onPress={handleLogout}
            style={{
              backgroundColor: theme.redBg,
              borderRadius: 18,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}
          >
            <Ionicons name="log-out-outline" size={18} color={theme.red} />
            <Text style={{ color: theme.red, fontWeight: '700', fontSize: 15 }}>
              {i18n('profile_logout')}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      <SheetModal
        visible={showEditSheet}
        onRequestClose={() => setShowEditSheet(false)}
      >
        {school ? (
          <EditSchoolSheet
            school={school}
            onClose={() => setShowEditSheet(false)}
          />
        ) : (
          <View style={{ flex: 1, backgroundColor: theme.bg }} />
        )}
      </SheetModal>
    </>
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
