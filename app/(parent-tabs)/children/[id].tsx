import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { SheetModal } from '@/shared/ui/molecules/SheetModal';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useAppNavigation } from '@/navigation/useAppNavigation';
import { useTheme } from '@/theme';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useChild, useDeleteChild } from '@/features/parent/hooks/useChildren';
import { Toast } from '@/shared/ui/molecules/Toast';
import {
  useGuardians,
  useToggleGuardian,
  useDeleteGuardian,
} from '@/features/parent/hooks/useGuardians';
import type { Guardian } from '@/features/parent/types';
import { Avatar } from '@/shared/ui/base/avatar';
import { EditChildSheet } from '@/features/parent/components/ui/EditChildSheet';

const AuthorizationCard = React.memo(function AuthorizationCard({
  item,
  index,
  onToggle,
  onDelete,
  onEdit,
}: {
  item: Guardian;
  index: number;
  onToggle: (id: string, current: boolean) => void;
  onDelete: (id: string, name: string) => void;
  onEdit: (id: string) => void;
}) {
  const theme = useTheme();
  const expiryColor = item.is_active ? theme.green : theme.red;
  const expiryBg = item.is_active ? theme.greenBg : theme.redBg;

  const handleToggle = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle(item.id, item.is_active);
  }, [item.id, item.is_active, onToggle]);

  const handleDelete = useCallback(() => {
    onDelete(item.id, `${item.first_name} ${item.last_name}`);
  }, [item.id, item.first_name, item.last_name, onDelete]);

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).duration(400)}
      style={{ marginBottom: 10 }}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => onEdit(item.id)}
        onLongPress={handleDelete}
        delayLongPress={500}
      >
        <View
          style={{
            backgroundColor: theme.card,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: item.is_active
              ? 'rgba(16,185,129,0.25)'
              : theme.cardBorder,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              width: 4,
              position: 'absolute',
              top: 0,
              bottom: 0,
              backgroundColor: item.is_active ? theme.green : theme.separator,
            }}
          />
          <View style={{ padding: 14, paddingLeft: 18 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <View style={{ marginRight: 12 }}>
                <Avatar
                  image={{
                    uri: '',
                    name: `${item.first_name} ${item.last_name}`,
                  }}
                  size={44}
                  showBorder={false}
                  backgroundColor={
                    item.is_active ? theme.greenBg : theme.iconBg
                  }
                  textColor={item.is_active ? theme.green : theme.textMuted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ color: theme.text, fontWeight: '700', fontSize: 15 }}
                >
                  {item.first_name} {item.last_name}
                </Text>
                <Text
                  style={{ color: theme.textMuted, fontSize: 12, marginTop: 1 }}
                >
                  {item.relationship}
                </Text>
              </View>
              <Switch
                value={item.is_active}
                onValueChange={handleToggle}
                trackColor={{ false: theme.switchTrackOff, true: theme.green }}
                thumbColor="#ffffff"
                ios_backgroundColor={theme.switchTrackOff}
              />
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
              >
                <Ionicons
                  name="call-outline"
                  size={12}
                  color={theme.textMuted}
                />
                <Text style={{ color: theme.textMuted, fontSize: 12 }}>
                  {item.phone}
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: expiryBg,
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                  borderRadius: 8,
                }}
              >
                <Text
                  style={{
                    color: expiryColor,
                    fontSize: 11,
                    fontWeight: '700',
                  }}
                >
                  {item.is_active ? 'Actif' : 'Désactivé'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

export default function ChildDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const nav = useAppNavigation();
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const navigation = useNavigation();
  const childId = id ?? '';
  const { data: child, isLoading: childLoading } = useChild(childId);
  const deleteChild = useDeleteChild();

  useEffect(() => {
    if (child) {
      navigation.setOptions({
        title: `${child.first_name} ${child.last_name}`,
      });
    }
  }, [child, navigation]);
  const { data: authorizations, isLoading: authLoading } =
    useGuardians(childId);
  const togglePerson = useToggleGuardian(childId);
  const deletePerson = useDeleteGuardian(childId);

  const [editSheetVisible, setEditSheetVisible] = useState(false);

  const handleToggle = useCallback(
    (guardianId: string, currentActive: boolean) => {
      const nextActive = !currentActive;
      togglePerson.mutate(
        { guardianId, isActive: nextActive },
        {
          onSuccess: () => {
            Toast.show(nextActive ? 'Accès activé' : 'Accès désactivé', {
              type: nextActive ? 'success' : 'warning',
              duration: 2500,
            });
          },
          onError: () => {
            Toast.show("Impossible de modifier l'accès", { type: 'error' });
          },
        }
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [togglePerson]
  );

  const handleDelete = useCallback(
    (guardianId: string, name: string) => {
      Alert.alert(
        "Supprimer l'autorisation",
        `Retirer l'accès à ${name} ? Cette personne ne pourra plus récupérer l'enfant.`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: () => {
              deletePerson.mutate(guardianId);
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
            },
          },
        ]
      );
    },
    [deletePerson]
  );

  const handleEditGuardian = useCallback(
    (guardianId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      nav.goToParentGuardianEdit(guardianId, childId);
    },
    [nav, childId]
  );

  const handleAddPerson = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    nav.goToParentGuardianAdd(childId);
  }, [nav, childId]);

  const handleDeleteChild = useCallback(() => {
    if (!child) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      "Supprimer l'enfant",
      `Voulez-vous vraiment supprimer ${child.first_name} ${child.last_name} ? Toutes les autorisations associées seront également supprimées. Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            deleteChild.mutate(childId, {
              onSuccess: () => {
                Toast.show(`${child.first_name} a été supprimé(e)`, {
                  type: 'success',
                  duration: 3000,
                });
                navigation.goBack();
              },
              onError: () => {
                Toast.show("Impossible de supprimer l'enfant", {
                  type: 'error',
                });
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Error
                );
              },
            });
          },
        },
      ]
    );
  }, [child, childId, deleteChild, navigation]);

  const activeCount = useMemo(
    () => (authorizations ?? []).filter(a => a.is_active).length,
    [authorizations]
  );

  if (childLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={theme.accent} size="large" />
      </View>
    );
  }

  if (!child) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: theme.textMuted }}>Enfant introuvable.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        {/* Chips: classe + autorisations actives */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={{
            backgroundColor: theme.card,
            borderBottomWidth: 1,
            borderBottomColor: theme.cardBorder,
            paddingVertical: 12,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View
            style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', flex: 1 }}
          >
            {child.class_name ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  backgroundColor: theme.primaryBg,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 10,
                }}
              >
                <Ionicons
                  name="school-outline"
                  size={13}
                  color={theme.primary}
                />
                <Text
                  style={{
                    color: theme.primary,
                    fontSize: 12,
                    fontWeight: '700',
                  }}
                >
                  {child.class_name}
                </Text>
              </View>
            ) : null}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                backgroundColor: theme.greenBg,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 10,
              }}
            >
              <Ionicons name="shield-checkmark" size={13} color={theme.green} />
              <Text
                style={{ color: theme.green, fontSize: 12, fontWeight: '700' }}
              >
                {activeCount} autorisation{activeCount > 1 ? 's' : ''} active
                {activeCount > 1 ? 's' : ''}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setEditSheetVisible(true);
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                backgroundColor: theme.profileEditBg,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
            >
              <Ionicons
                name="pencil-outline"
                size={13}
                color={theme.textSecondary}
              />
              <Text
                style={{ color: theme.text, fontWeight: '600', fontSize: 13 }}
              >
                Modifier
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDeleteChild}
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.redBg,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
            >
              <Ionicons name="trash-outline" size={15} color={theme.red} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Authorizations */}
        <View style={{ padding: 16 }}>
          <Animated.View
            entering={FadeInDown.delay(100).duration(400)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
            }}
          >
            <Text
              style={{ color: theme.text, fontSize: 17, fontWeight: '700' }}
            >
              Personnes autorisées
            </Text>
            <TouchableOpacity
              onPress={handleAddPerson}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                backgroundColor: theme.accent,
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 12,
              }}
            >
              <Ionicons name="person-add-outline" size={14} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>
                Ajouter
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {authLoading ? (
            <ActivityIndicator color={theme.accent} style={{ marginTop: 20 }} />
          ) : (authorizations ?? []).length === 0 ? (
            <View
              style={{
                backgroundColor: theme.card,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: theme.cardBorder,
                padding: 24,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: theme.textMuted,
                  fontSize: 14,
                  textAlign: 'center',
                }}
              >
                Aucune personne autorisée.{'\n'}Ajoutez quelqu'un pour permettre
                la récupération.
              </Text>
            </View>
          ) : (
            (authorizations ?? []).map((auth, i) => (
              <AuthorizationCard
                key={auth.id}
                item={auth}
                index={i}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onEdit={handleEditGuardian}
              />
            ))
          )}
        </View>
      </ScrollView>

      <SheetModal
        visible={editSheetVisible}
        onRequestClose={() => setEditSheetVisible(false)}
      >
        <EditChildSheet
          child={child}
          onClose={() => setEditSheetVisible(false)}
        />
      </SheetModal>
    </View>
  );
}
