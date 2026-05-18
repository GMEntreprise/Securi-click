import React, { useState, useCallback } from 'react';
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
import {
  Bell,
  Camera,
  ShieldCheck,
  ShieldOff,
  AlertTriangle,
  Clock,
  LogOut,
  ChevronRight,
  FileText,
  Pencil,
} from 'lucide-react-native';
import { useTheme } from '@/theme';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useUnreadCount } from '@/features/notifications/stores/notification.store';
import {
  useCollectorProfile,
  useMyIdentity,
} from '@/features/collector/hooks/useCollector';
import { EditCollectorSheet } from '@/features/collector/components/ui/EditCollectorSheet';
import IdentityVerificationSheet from './IdentityVerificationSheet';
import { Avatar } from '@/shared/ui/base/avatar';

export default function CollectorProfileScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const router = useRouter();
  const logout = useAuthStore(s => s.logout);
  const unreadCount = useUnreadCount();

  const { data: profile, isLoading } = useCollectorProfile();
  const { data: identity } = useMyIdentity();

  const [showEditSheet, setShowEditSheet] = useState(false);
  const [showIdentitySheet, setShowIdentitySheet] = useState(false);

  const handleLogout = useCallback(() => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnecter',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  }, [logout]);

  const identityStatusConfig = {
    verified: {
      label: 'Identité vérifiée',
      color: '#10b981',
      bg: 'rgba(16,185,129,0.12)',
      Icon: ShieldCheck,
    },
    pending: {
      label: 'Vérification en attente',
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.12)',
      Icon: Clock,
    },
    refused: {
      label: 'Vérification refusée',
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.12)',
      Icon: ShieldOff,
    },
    expired: {
      label: 'Identité expirée',
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.12)',
      Icon: ShieldOff,
    },
    none: {
      label: 'Identité non vérifiée',
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.12)',
      Icon: AlertTriangle,
    },
  } as const;

  const status = identity?.verification_status ?? 'none';
  const idCfg =
    identityStatusConfig[status as keyof typeof identityStatusConfig] ??
    identityStatusConfig.none;
  const IdIcon = idCfg.Icon;

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
              setShowEditSheet(true);
            }}
            style={{ marginBottom: 14 }}
          >
            <Avatar
              image={{
                uri: profile?.avatar_url ?? '',
                name: `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim(),
              }}
              size={90}
              showBorder={false}
              backgroundColor={theme.accentBg}
              textColor={theme.accent}
              loading={!profile}
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
            <Pencil size={13} color={theme.textSecondary} strokeWidth={2.5} />
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
            <IdIcon size={20} color={idCfg.color} strokeWidth={2.5} />
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
            <ChevronRight size={16} color={idCfg.color} />
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

        {/* Identity document button */}
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
              <FileText size={18} color={theme.accent} />
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
            <ChevronRight size={16} color={theme.textMuted} />
          </TouchableOpacity>
        </Animated.View>

        {/* Notifications */}
        <Animated.View
          entering={FadeInDown.delay(220).duration(350)}
          style={{ marginBottom: 16 }}
        >
          <TouchableOpacity
            onPress={() => router.push('/(collector-tabs)/profile/notifications' as any)}
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

        {/* Logout */}
        <Animated.View entering={FadeInDown.delay(240).duration(350)}>
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

      {/* Edit profile modal */}
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
