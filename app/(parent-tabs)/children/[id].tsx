import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  Shield,
  Phone,
  ToggleLeft,
  ToggleRight,
  UserPlus,
  GraduationCap,
  Trash2,
} from 'lucide-react-native';
import { useChild } from '@/features/parent/hooks/useChildren';
import {
  useGuardians,
  useToggleGuardian,
  useDeleteGuardian,
} from '@/features/parent/hooks/useGuardians';
import type { Guardian } from '@/features/parent/types';

const AuthorizationCard = React.memo(function AuthorizationCard({
  item,
  index,
  onToggle,
  onDelete,
}: {
  item: Guardian;
  index: number;
  onToggle: (id: string, current: boolean) => void;
  onDelete: (id: string, name: string) => void;
}) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: withSpring(scale.value, { damping: 15, stiffness: 300 }) },
    ],
  }));

  const expiryColor = theme.green;
  const expiryBg = theme.greenBg;

  const handleToggle = useCallback(() => {
    scale.value = 0.95;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => {
      scale.value = 1;
      onToggle(item.id, item.is_active);
    }, 100);
  }, [item.id, item.is_active, onToggle, scale]);

  const handleDelete = useCallback(() => {
    onDelete(item.id, `${item.first_name} ${item.last_name}`);
  }, [item.id, item.first_name, item.last_name, onDelete]);

  const initials = `${item.first_name[0] ?? '?'}${item.last_name[0] ?? ''}`;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).duration(400)}
      style={{ marginBottom: 10 }}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => {}}
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
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: item.is_active
                    ? theme.greenBg
                    : theme.iconBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <Text
                  style={{
                    color: item.is_active ? theme.green : theme.textMuted,
                    fontSize: 15,
                    fontWeight: '800',
                  }}
                >
                  {initials}
                </Text>
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
              <TouchableOpacity
                onPress={handleToggle}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: item.is_active
                    ? theme.greenBg
                    : theme.iconBg,
                }}
              >
                <Animated.View style={animatedStyle}>
                  {item.is_active ? (
                    <ToggleRight size={22} color={theme.green} />
                  ) : (
                    <ToggleLeft size={22} color={theme.textMuted} />
                  )}
                </Animated.View>
              </TouchableOpacity>
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
                <Phone size={12} color={theme.textMuted} />
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
                  Actif
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
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const childId = id ?? '';
  const { data: child, isLoading: childLoading } = useChild(childId);
  const { data: authorizations, isLoading: authLoading } =
    useGuardians(childId);
  const togglePerson = useToggleGuardian(childId);
  const deletePerson = useDeleteGuardian(childId);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  const handleToggle = useCallback(
    (guardianId: string, currentActive: boolean) => {
      togglePerson.mutate({ guardianId, isActive: !currentActive });
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

  const handleAddPerson = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(
      `/(parent-tabs)/authorized-persons/add?childId=${childId}` as any
    );
  }, [router, childId]);

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
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={{
            backgroundColor: theme.card,
            borderBottomWidth: 1,
            borderBottomColor: theme.cardBorder,
            paddingTop: insets.top + 16,
            paddingBottom: 20,
            paddingHorizontal: 20,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <TouchableOpacity
              onPress={handleBack}
              style={{
                width: 40,
                height: 40,
                borderRadius: 14,
                backgroundColor: theme.iconBg,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 14,
              }}
            >
              <ArrowLeft size={20} color={theme.text} strokeWidth={2} />
            </TouchableOpacity>
            <View>
              <Text
                style={{
                  color: theme.textMuted,
                  fontSize: 11,
                  fontWeight: '700',
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  marginBottom: 2,
                }}
              >
                Fiche enfant
              </Text>
              <Text
                style={{
                  color: theme.text,
                  fontSize: 22,
                  fontWeight: '800',
                  letterSpacing: -0.5,
                }}
              >
                {child.first_name} {child.last_name}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
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
                <GraduationCap size={13} color={theme.primary} />
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
              <Shield size={13} color={theme.green} />
              <Text
                style={{ color: theme.green, fontSize: 12, fontWeight: '700' }}
              >
                {activeCount} autorisation{activeCount > 1 ? 's' : ''} active
                {activeCount > 1 ? 's' : ''}
              </Text>
            </View>
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
              <UserPlus size={14} color="#fff" strokeWidth={2.5} />
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
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
