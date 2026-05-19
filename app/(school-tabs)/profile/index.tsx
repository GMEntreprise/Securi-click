import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  Bell,
  Building2,
  ChevronRight,
  FileText,
  HelpCircle,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Pencil,
  Phone,
} from 'lucide-react-native';
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

export default function SchoolProfileScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const nav = useAppNavigation();
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
    async (picker: () => Promise<{ signedUrl: string; filePath: string } | null>) => {
      if (!school?.id) return;
      const result = await picker();
      if (!result) return;
      await updateLogo.mutateAsync({ schoolId: school.id, logoUrl: result.signedUrl });
    },
    [school?.id, updateLogo]
  );

  const handleRemoveLogo = useCallback(async () => {
    if (!school?.id) return;
    await updateLogo.mutateAsync({ schoolId: school.id, logoUrl: '' });
  }, [school?.id, updateLogo]);

  const handleLogout = useCallback(() => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnecter', style: 'destructive', onPress: () => nav.logout() },
    ]);
  }, [nav]);

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
              <Pencil size={12} color="#fff" strokeWidth={2.5} />
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
            <Pencil size={13} color={theme.textSecondary} strokeWidth={2.5} />
            <Text
              style={{ color: theme.text, fontWeight: '600', fontSize: 14 }}
            >
              Modifier l'établissement
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
              icon={<Building2 size={15} color={theme.textMuted} />}
              label="Responsable"
              value={`${school?.manager_first_name ?? ''} ${school?.manager_last_name ?? ''}`.trim()}
            />
            <InfoRow
              icon={<Mail size={15} color={theme.textMuted} />}
              label="Email"
              value={school?.email ?? '—'}
            />
            <InfoRow
              icon={<Phone size={15} color={theme.textMuted} />}
              label="Téléphone"
              value={school?.phone ?? '—'}
            />
            <InfoRow
              icon={<MapPin size={15} color={theme.textMuted} />}
              label="Adresse"
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
              <Bell size={18} color={theme.green} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.text, fontWeight: '700', fontSize: 15 }}>
                Notifications
              </Text>
              <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 1 }}>
                {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Tout est lu'}
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
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
            <ChevronRight size={16} color={theme.textMuted} />
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
                <HelpCircle size={16} color={theme.amber} strokeWidth={2.5} />
              </View>
              <Text style={{ flex: 1, color: theme.text, fontWeight: '600', fontSize: 15 }}>
                Aide & FAQ
              </Text>
              <ChevronRight size={16} color={theme.textMuted} />
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
                <FileText size={16} color={theme.textMuted} strokeWidth={2.5} />
              </View>
              <Text style={{ flex: 1, color: theme.text, fontWeight: '600', fontSize: 15 }}>
                Mentions légales
              </Text>
              <ChevronRight size={16} color={theme.textMuted} />
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
                <Lock size={16} color={theme.textMuted} strokeWidth={2.5} />
              </View>
              <Text style={{ flex: 1, color: theme.text, fontWeight: '600', fontSize: 15 }}>
                Politique de confidentialité
              </Text>
              <ChevronRight size={16} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Logout */}
        <Animated.View entering={FadeInDown.delay(140).duration(350)}>
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
            <LogOut size={18} color={theme.red} strokeWidth={2.5} />
            <Text style={{ color: theme.red, fontWeight: '700', fontSize: 15 }}>
              Se déconnecter
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      <Modal
        visible={showEditSheet}
        animationType="slide"
        presentationStyle="pageSheet"
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
      </Modal>
    </>
  );
}

function InfoRow({
  icon,
  label,
  value,
  isLast = false,
}: {
  icon: React.ReactNode;
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
      {icon}
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
