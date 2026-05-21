import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
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

export default function CollectorProfileScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
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
          toggleTheme({ animationType: 'circular' as any, animationDuration: 500 });
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
        Toast.show("Impossible de sauvegarder la photo. Réessayez.", { type: 'error', duration: 3000 });
      }
    },
    [updateAvatarUrl]
  );

  const handleRemoveAvatar = useCallback(async () => {
    setLocalAvatarUri('');
    try {
      await updateAvatarUrl.mutateAsync('');
    } catch {
      Toast.show("Impossible de supprimer la photo. Réessayez.", { type: 'error', duration: 3000 });
    }
  }, [updateAvatarUrl]);

  const handleLogout = useCallback(() => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnecter',
        style: 'destructive',
        onPress: async () => {
          await nav.logout();
        },
      },
    ]);
  }, [nav]);

  const identityStatusConfig = {
    verified: {
      label: 'Identité vérifiée',
      color: '#10b981',
      bg: 'rgba(16,185,129,0.12)',
      iconName: 'shield-checkmark-outline' as const,
    },
    pending: {
      label: 'Vérification en attente',
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.12)',
      iconName: 'time-outline' as const,
    },
    refused: {
      label: 'Vérification refusée',
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.12)',
      iconName: 'shield-outline' as const,
    },
    expired: {
      label: 'Identité expirée',
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.12)',
      iconName: 'shield-outline' as const,
    },
    none: {
      label: 'Identité non vérifiée',
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.12)',
      iconName: 'warning-outline' as const,
    },
  } as const;

  const status = identity?.verification_status ?? 'none';
  const idCfg =
    identityStatusConfig[status as keyof typeof identityStatusConfig] ??
    identityStatusConfig.none;

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
        {/* Avatar + Name */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={{ alignItems: 'center', marginBottom: 28 }}
        >
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setAvatarPickerVisible(true);
            }}
            style={{ marginBottom: 14 }}
            activeOpacity={0.8}
          >
            <Avatar
              image={{
                uri: avatarUri ?? '',
                name: `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim(),
              }}
              size={90}
              showBorder={false}
              backgroundColor={theme.accentBg}
              textColor={theme.accent}
              loading={!profile || isUploading || updateAvatarUrl.isPending}
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

          <Text style={{ color: theme.text, fontSize: 22, fontWeight: '800' }}>
            {profile?.first_name} {profile?.last_name}
          </Text>
          <Text style={{ color: theme.textMuted, fontSize: 13, marginTop: 4 }}>
            Collecteur autorisé
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
            <Ionicons name="pencil-outline" size={13} color={theme.textSecondary} />
            <Text
              style={{ color: theme.text, fontWeight: '600', fontSize: 14 }}
            >
              Modifier le profil
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Identity status banner */}
        <Animated.View
          entering={FadeInDown.delay(60).duration(350)}
          style={{ marginBottom: 20 }}
        >
          <TouchableOpacity
            onPress={() => setShowIdentitySheet(true)}
            style={{
              backgroundColor: idCfg.bg,
              borderRadius: 16,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Ionicons name={idCfg.iconName} size={20} color={idCfg.color} />
            <View style={{ flex: 1 }}>
              <Text
                style={{ color: idCfg.color, fontSize: 14, fontWeight: '700' }}
              >
                {idCfg.label}
              </Text>
              {identity?.verified_at ? (
                <Text
                  style={{
                    color: idCfg.color,
                    fontSize: 12,
                    opacity: 0.8,
                    marginTop: 2,
                  }}
                >
                  Vérifié le{' '}
                  {new Date(identity.verified_at).toLocaleDateString('fr-FR')}
                </Text>
              ) : (
                <Text
                  style={{
                    color: idCfg.color,
                    fontSize: 12,
                    opacity: 0.8,
                    marginTop: 2,
                  }}
                >
                  Appuyez pour{' '}
                  {status === 'none' ? 'soumettre' : 'voir le statut'}
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={16} color={idCfg.color} />
          </TouchableOpacity>
        </Animated.View>

        {/* Profile info card (read-only) */}
        <Animated.View
          entering={FadeInDown.delay(120).duration(350)}
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
            <ProfileRow label="Prénom" value={profile?.first_name ?? '—'} />
            <ProfileRow label="Nom" value={profile?.last_name ?? '—'} />
            <ProfileRow label="Téléphone" value={profile?.phone ?? '—'} />
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowEditSheet(true);
              }}
              style={{
                padding: 16,
                alignItems: 'center',
                borderTopWidth: 1,
                borderTopColor: theme.separator,
              }}
            >
              <Text
                style={{ color: theme.accent, fontWeight: '700', fontSize: 14 }}
              >
                Modifier mes informations
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Pièce d'identité */}
        <Animated.View
          entering={FadeInDown.delay(180).duration(350)}
          style={{ marginBottom: 20 }}
        >
          <TouchableOpacity
            onPress={() => setShowIdentitySheet(true)}
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
              <Ionicons name="document-text-outline" size={18} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{ color: theme.text, fontWeight: '700', fontSize: 15 }}
              >
                Pièce d'identité
              </Text>
              <Text
                style={{ color: theme.textMuted, fontSize: 12, marginTop: 1 }}
              >
                {status === 'verified'
                  ? 'Vérifiée'
                  : 'Soumettre pour vérification'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
          </TouchableOpacity>
        </Animated.View>

        {/* Mode sombre */}
        <Animated.View
          entering={FadeInDown.delay(205).duration(350)}
          style={{ marginBottom: 16 }}
        >
          <View
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
                backgroundColor: theme.iconBg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="moon-outline" size={18} color={theme.textSecondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.text, fontWeight: '700', fontSize: 15 }}>
                Mode sombre
              </Text>
              <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 1 }}>
                {isDark ? 'Activé' : 'Désactivé'}
              </Text>
            </View>
            {darkModeSwitch}
          </View>
        </Animated.View>

        {/* Notifications */}
        <Animated.View
          entering={FadeInDown.delay(220).duration(350)}
          style={{ marginBottom: 16 }}
        >
          <TouchableOpacity
            onPress={() => nav.goToCollectorNotifications()}
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
              <Ionicons name="notifications-outline" size={18} color={theme.green} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.text, fontWeight: '700', fontSize: 15 }}>
                Notifications
              </Text>
              <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 1 }}>
                {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : '0 notification'}
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
            <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
          </TouchableOpacity>
        </Animated.View>

        {/* Support & Légal */}
        <Animated.View
          entering={FadeInDown.delay(230).duration(350)}
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
              onPress={() => nav.goToCollectorFaq()}
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
                <Ionicons name="help-circle-outline" size={16} color={theme.amber} />
              </View>
              <Text style={{ flex: 1, color: theme.text, fontWeight: '600', fontSize: 15 }}>
                Aide & FAQ
              </Text>
              <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => nav.goToCollectorLegalMentions()}
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
                <Ionicons name="document-text-outline" size={16} color={theme.textMuted} />
              </View>
              <Text style={{ flex: 1, color: theme.text, fontWeight: '600', fontSize: 15 }}>
                Mentions légales
              </Text>
              <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => nav.goToCollectorPrivacyPolicy()}
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
                <Ionicons name="lock-closed-outline" size={16} color={theme.textMuted} />
              </View>
              <Text style={{ flex: 1, color: theme.text, fontWeight: '600', fontSize: 15 }}>
                Politique de confidentialité
              </Text>
              <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Logout */}
        <Animated.View entering={FadeInDown.delay(260).duration(350)}>
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
        {profile ? (
          <EditCollectorSheet
            profile={profile}
            onClose={() => setShowEditSheet(false)}
          />
        ) : (
          <View style={{ flex: 1, backgroundColor: theme.bg }} />
        )}
      </Modal>

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

function ProfileRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 13,
        borderBottomWidth: 1,
        borderBottomColor: theme.separator,
      }}
    >
      <Text style={{ color: theme.textMuted, fontSize: 13, fontWeight: '600' }}>
        {label}
      </Text>
      <Text style={{ color: theme.text, fontSize: 14, fontWeight: '500' }}>
        {value}
      </Text>
    </View>
  );
}
