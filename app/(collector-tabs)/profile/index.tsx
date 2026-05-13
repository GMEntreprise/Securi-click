import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  User,
  Camera,
  ShieldCheck,
  ShieldOff,
  AlertTriangle,
  Clock,
  LogOut,
  ChevronRight,
  FileText,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/theme';
import { useAuthStore } from '@/features/auth/store/auth.store';
import {
  useCollectorProfile,
  useUpdateCollectorProfile,
  useUploadCollectorAvatar,
  useMyIdentity,
} from '@/features/collector/hooks/useCollector';
import IdentityVerificationSheet from './IdentityVerificationSheet';

export default function CollectorProfileScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const logout = useAuthStore(s => s.logout);

  const { data: profile, isLoading } = useCollectorProfile();
  const { data: identity } = useMyIdentity();
  const updateProfile = useUpdateCollectorProfile();
  const uploadAvatar = useUploadCollectorAvatar();

  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [showIdentitySheet, setShowIdentitySheet] = useState(false);

  const startEdit = useCallback(() => {
    if (!profile) return;
    setFirstName(profile.first_name);
    setLastName(profile.last_name);
    setPhone(profile.phone ?? '');
    setEditing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [profile]);

  const saveEdit = useCallback(async () => {
    if (!firstName.trim() || !lastName.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateProfile.mutateAsync({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone.trim(),
    });
    setEditing(false);
  }, [firstName, lastName, phone, updateProfile]);

  const handleAvatarPress = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      await uploadAvatar.mutateAsync(result.assets[0].uri);
    }
  }, [uploadAvatar]);

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
            onPress={handleAvatarPress}
            style={{ marginBottom: 14 }}
          >
            {profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={{ width: 90, height: 90, borderRadius: 28 }}
              />
            ) : (
              <View
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: 28,
                  backgroundColor: theme.accentBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <User size={38} color={theme.accent} />
              </View>
            )}
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

          {!editing ? (
            <>
              <Text
                style={{ color: theme.text, fontSize: 22, fontWeight: '800' }}
              >
                {profile?.first_name} {profile?.last_name}
              </Text>
              <Text
                style={{ color: theme.textMuted, fontSize: 13, marginTop: 4 }}
              >
                Collecteur autorisé
              </Text>
            </>
          ) : null}
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

        {/* Profile form */}
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
            {editing ? (
              <View style={{ padding: 16, gap: 12 }}>
                <View>
                  <Text
                    style={{
                      color: theme.textMuted,
                      fontSize: 11,
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      marginBottom: 6,
                    }}
                  >
                    Prénom
                  </Text>
                  <TextInput
                    value={firstName}
                    onChangeText={setFirstName}
                    style={{
                      backgroundColor: theme.input,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: theme.inputBorder,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      color: theme.text,
                      fontSize: 15,
                    }}
                  />
                </View>
                <View>
                  <Text
                    style={{
                      color: theme.textMuted,
                      fontSize: 11,
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      marginBottom: 6,
                    }}
                  >
                    Nom
                  </Text>
                  <TextInput
                    value={lastName}
                    onChangeText={setLastName}
                    style={{
                      backgroundColor: theme.input,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: theme.inputBorder,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      color: theme.text,
                      fontSize: 15,
                    }}
                  />
                </View>
                <View>
                  <Text
                    style={{
                      color: theme.textMuted,
                      fontSize: 11,
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      marginBottom: 6,
                    }}
                  >
                    Téléphone
                  </Text>
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    style={{
                      backgroundColor: theme.input,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: theme.inputBorder,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      color: theme.text,
                      fontSize: 15,
                    }}
                  />
                </View>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                  <TouchableOpacity
                    onPress={() => setEditing(false)}
                    style={{
                      flex: 1,
                      paddingVertical: 13,
                      borderRadius: 14,
                      backgroundColor: theme.iconBg,
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        color: theme.textSecondary,
                        fontWeight: '700',
                        fontSize: 14,
                      }}
                    >
                      Annuler
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={saveEdit}
                    disabled={updateProfile.isPending}
                    style={{
                      flex: 1,
                      paddingVertical: 13,
                      borderRadius: 14,
                      backgroundColor: theme.accent,
                      alignItems: 'center',
                      opacity: updateProfile.isPending ? 0.7 : 1,
                    }}
                  >
                    <Text
                      style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}
                    >
                      {updateProfile.isPending ? 'Sauvegarde…' : 'Sauvegarder'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <ProfileRow label="Prénom" value={profile?.first_name ?? '—'} />
                <ProfileRow label="Nom" value={profile?.last_name ?? '—'} />
                <ProfileRow label="Téléphone" value={profile?.phone ?? '—'} />
                <TouchableOpacity
                  onPress={startEdit}
                  style={{
                    padding: 16,
                    alignItems: 'center',
                    borderTopWidth: 1,
                    borderTopColor: theme.separator,
                  }}
                >
                  <Text
                    style={{
                      color: theme.accent,
                      fontWeight: '700',
                      fontSize: 14,
                    }}
                  >
                    Modifier mes informations
                  </Text>
                </TouchableOpacity>
              </>
            )}
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
