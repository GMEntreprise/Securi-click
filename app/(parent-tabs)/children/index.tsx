import React, { useCallback, useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  FlatList,
  Switch,
  Alert,
} from 'react-native';
import { SheetModal } from '@/shared/ui/molecules/SheetModal';
import { useTheme } from '@/theme';
import { useAppNavigation } from '@/navigation/useAppNavigation';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import {
  useChildren,
  useDeleteChild,
} from '@/features/parent/hooks/useChildren';
import {
  useGuardians,
  useToggleGuardian,
  useDeleteGuardian,
} from '@/features/parent/hooks/useGuardians';
import type { Child, Guardian } from '@/features/parent/types';
import { EditChildSheet } from '@/features/parent/components/ui/EditChildSheet';
import { Avatar } from '@/shared/ui/base/avatar';
import { QueryError } from '@/shared/ui/base/query-error';
import { Toast } from '@/shared/ui/molecules/Toast';
import { useChildrenSheetStore } from '@/features/parent/stores/childrenSheet.store';

// ── Child card inside the "Mes enfants" bottom sheet ──────────────────────────

const ChildSheetCard = React.memo(function ChildSheetCard({
  item,
  index,
  onPress,
}: {
  item: Child;
  index: number;
  onPress: (c: Child) => void;
}) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).duration(300)}
      style={{ marginBottom: 10 }}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => {
          scale.value = withSpring(0.97, { damping: 12, stiffness: 300 });
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setTimeout(() => {
            scale.value = withSpring(1);
            onPress(item);
          }, 80);
        }}
      >
        <Animated.View
          style={[
            animStyle,
            {
              backgroundColor: theme.card,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: theme.cardBorder,
              paddingHorizontal: 16,
              paddingVertical: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            },
          ]}
        >
          <Avatar
            image={{
              uri: item.photo_url ?? '',
              name: `${item.first_name} ${item.last_name}`,
            }}
            size={48}
            showBorder={false}
            backgroundColor={theme.primaryBg}
            textColor={theme.primary}
          />
          <View style={{ flex: 1 }}>
            <Text
              style={{ color: theme.text, fontSize: 16, fontWeight: '700' }}
            >
              {item.first_name} {item.last_name}
            </Text>
            <Text
              style={{ color: theme.textMuted, fontSize: 13, marginTop: 2 }}
            >
              {item.class_name ?? '—'}
              {item.school ? ` · ${item.school.name}` : ''}
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color={theme.textMuted} />
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
});

// ── Bottom sheet: choose child (to navigate to detail or add guardian) ────────

function ChildrenPickerSheet({
  visible,
  children,
  onClose,
  onSelectChild,
  onAddChild,
}: {
  visible: boolean;
  children: Child[];
  onClose: () => void;
  onSelectChild: (c: Child) => void;
  onAddChild: () => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const renderItem = useCallback(
    ({ item, index }: { item: Child; index: number }) => (
      <ChildSheetCard item={item} index={index} onPress={onSelectChild} />
    ),
    [onSelectChild]
  );

  return (
    <SheetModal visible={visible} onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        {/* Handle */}
        <View
          style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}
        >
          <View
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: theme.separator,
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
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: theme.cardBorder,
          }}
        >
          <View>
            <Text
              style={{
                color: theme.textMuted,
                fontSize: 11,
                fontWeight: '700',
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}
            >
              Mes enfants
            </Text>
            <Text
              style={{
                color: theme.text,
                fontSize: 20,
                fontWeight: '800',
                letterSpacing: -0.5,
                marginTop: 2,
              }}
            >
              {children.length} enfant{children.length > 1 ? 's' : ''}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: theme.iconBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialCommunityIcons
              name="close"
              size={18}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <FlatList
          data={children}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + 24,
          }}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            <TouchableOpacity
              onPress={onAddChild}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                backgroundColor: theme.accentBg,
                borderRadius: 16,
                paddingVertical: 14,
                borderWidth: 1,
                borderColor: 'transparent',
                marginTop: 4,
              }}
            >
              <MaterialCommunityIcons
                name="account-plus"
                size={18}
                color={theme.accent}
              />
              <Text
                style={{ color: theme.accent, fontWeight: '700', fontSize: 14 }}
              >
                Ajouter un enfant
              </Text>
            </TouchableOpacity>
          }
        />
      </View>
    </SheetModal>
  );
}

// ── Bottom sheet: add first child (no children yet) ───────────────────────────

function AddFirstChildSheet({
  visible,
  onClose,
  onAdd,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: () => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <SheetModal visible={visible} onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        <View
          style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}
        >
          <View
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: theme.separator,
            }}
          />
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: theme.cardBorder,
          }}
        >
          <Text style={{ color: theme.text, fontSize: 20, fontWeight: '800' }}>
            Mes enfants
          </Text>
          <TouchableOpacity
            onPress={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: theme.iconBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialCommunityIcons
              name="close"
              size={18}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 32,
            paddingBottom: insets.bottom + 40,
          }}
        >
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 24,
              backgroundColor: theme.primaryBg,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}
          >
            <MaterialCommunityIcons
              name="account-child"
              size={36}
              color={theme.primary}
            />
          </View>
          <Text
            style={{
              color: theme.text,
              fontSize: 18,
              fontWeight: '800',
              textAlign: 'center',
              marginBottom: 10,
            }}
          >
            Aucun enfant
          </Text>
          <Text
            style={{
              color: theme.textMuted,
              fontSize: 14,
              textAlign: 'center',
              lineHeight: 21,
              marginBottom: 28,
            }}
          >
            Ajoutez votre premier enfant pour commencer à gérer ses
            autorisations de récupération.
          </Text>
          <TouchableOpacity
            onPress={onAdd}
            style={{
              backgroundColor: theme.accent,
              borderRadius: 16,
              paddingVertical: 15,
              paddingHorizontal: 32,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <MaterialCommunityIcons
              name="account-plus"
              size={18}
              color="#fff"
            />
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
              Ajouter un enfant
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SheetModal>
  );
}

// ── Guardian card (one guardian row) ─────────────────────────────────────────

const GuardianCard = React.memo(function GuardianCard({
  item,
  index,
  childId,
  onEdit,
}: {
  item: Guardian;
  index: number;
  childId: string;
  onEdit: (guardianId: string, childId: string) => void;
}) {
  const theme = useTheme();
  const toggleGuardian = useToggleGuardian(childId);
  const deleteGuardian = useDeleteGuardian(childId);

  const handleToggle = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nextActive = !item.is_active;
    toggleGuardian.mutate(
      { guardianId: item.id, isActive: nextActive },
      {
        onSuccess: () =>
          Toast.show(nextActive ? 'Accès activé' : 'Accès désactivé', {
            type: nextActive ? 'success' : 'warning',
            duration: 2000,
          }),
        onError: () =>
          Toast.show("Impossible de modifier l'accès", { type: 'error' }),
      }
    );
  }, [item.id, item.is_active, toggleGuardian]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      "Retirer l'autorisation",
      `Retirer l'accès à ${item.first_name} ${item.last_name} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: () => {
            deleteGuardian.mutate(item.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  }, [item, deleteGuardian]);

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(350)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 12,
        gap: 12,
      }}
    >
      <Avatar
        image={{ uri: '', name: `${item.first_name} ${item.last_name}` }}
        size={44}
        showBorder={false}
        backgroundColor={item.is_active ? theme.greenBg : theme.iconBg}
        textColor={item.is_active ? theme.green : theme.textMuted}
      />
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.text, fontSize: 14, fontWeight: '700' }}>
          {item.first_name} {item.last_name}
        </Text>
        <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 1 }}>
          {item.relationship}
          {item.phone ? ` · ${item.phone}` : ''}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Switch
          value={item.is_active}
          onValueChange={handleToggle}
          trackColor={{ false: theme.switchTrackOff, true: theme.green }}
          thumbColor="#ffffff"
          ios_backgroundColor={theme.switchTrackOff}
        />
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onEdit(item.id, childId);
          }}
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            backgroundColor: theme.iconBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialCommunityIcons
            name="pencil-outline"
            size={15}
            color={theme.textSecondary}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleDelete}
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            backgroundColor: theme.redBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialCommunityIcons
            name="trash-can-outline"
            size={15}
            color={theme.red}
          />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
});

// ── Per-child section of guardians ────────────────────────────────────────────

const ChildGuardianSection = React.memo(function ChildGuardianSection({
  child,
  sectionIndex,
  onAddGuardian,
  onEditGuardian,
  onChildPress,
}: {
  child: Child;
  sectionIndex: number;
  onAddGuardian: (childId: string) => void;
  onEditGuardian: (guardianId: string, childId: string) => void;
  onChildPress: (child: Child) => void;
}) {
  const theme = useTheme();
  const { data: guardians, isLoading } = useGuardians(child.id);
  const count = guardians?.length ?? 0;
  const activeCount = useMemo(
    () => (guardians ?? []).filter(g => g.is_active).length,
    [guardians]
  );

  return (
    <Animated.View
      entering={FadeInDown.delay(sectionIndex * 80).duration(400)}
      style={{
        backgroundColor: theme.card,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: theme.cardBorder,
        marginBottom: 16,
        overflow: 'hidden',
      }}
    >
      {/* Child header */}
      <TouchableOpacity
        onPress={() => onChildPress(child)}
        activeOpacity={0.8}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 14,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: theme.separator,
          gap: 12,
        }}
      >
        <Avatar
          image={{
            uri: child.photo_url ?? '',
            name: `${child.first_name} ${child.last_name}`,
          }}
          size={40}
          showBorder={false}
          backgroundColor={theme.primaryBg}
          textColor={theme.primary}
        />
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.text, fontSize: 15, fontWeight: '700' }}>
            {child.first_name} {child.last_name}
          </Text>
          <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 1 }}>
            {child.class_name ?? '—'}
            {child.school ? ` · ${child.school.name}` : ''}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {count > 0 && (
            <View
              style={{
                backgroundColor: activeCount > 0 ? theme.greenBg : theme.iconBg,
                borderRadius: 10,
                paddingHorizontal: 8,
                paddingVertical: 3,
              }}
            >
              <Text
                style={{
                  color: activeCount > 0 ? theme.green : theme.textMuted,
                  fontSize: 11,
                  fontWeight: '700',
                }}
              >
                {activeCount} actif{activeCount > 1 ? 's' : ''}
              </Text>
            </View>
          )}
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onAddGuardian(child.id);
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              backgroundColor: theme.accent,
              borderRadius: 10,
              paddingHorizontal: 10,
              paddingVertical: 5,
            }}
          >
            <MaterialCommunityIcons
              name="account-plus"
              size={13}
              color="#fff"
            />
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>
              Ajouter
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Guardians list */}
      {isLoading ? (
        <View style={{ paddingVertical: 18, alignItems: 'center' }}>
          <ActivityIndicator color={theme.accent} size="small" />
        </View>
      ) : count === 0 ? (
        <View
          style={{
            paddingVertical: 16,
            paddingHorizontal: 14,
            alignItems: 'center',
            gap: 6,
          }}
        >
          <MaterialCommunityIcons
            name="shield-off-outline"
            size={24}
            color={theme.textMuted}
          />
          <Text
            style={{
              color: theme.textMuted,
              fontSize: 13,
              textAlign: 'center',
            }}
          >
            Aucune personne autorisée
          </Text>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onAddGuardian(child.id);
            }}
          >
            <Text
              style={{ color: theme.accent, fontSize: 13, fontWeight: '600' }}
            >
              Autoriser quelqu'un
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        (guardians ?? []).map((g, i) => (
          <React.Fragment key={g.id}>
            <GuardianCard
              item={g}
              index={i}
              childId={child.id}
              onEdit={onEditGuardian}
            />
            {i < count - 1 && (
              <View
                style={{
                  height: 1,
                  backgroundColor: theme.separator,
                  marginLeft: 70,
                }}
              />
            )}
          </React.Fragment>
        ))
      )}
    </Animated.View>
  );
});

// ── Main screen ───────────────────────────────────────────────────────────────

export default function CollectorsScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const nav = useAppNavigation();

  const { data: children, isLoading, isError, refetch } = useChildren();
  const deleteChild = useDeleteChild();
  const childrenCount = children?.length ?? 0;

  const [childrenSheetVisible, setChildrenSheetVisible] = useState(false);
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const editingChild = useMemo(
    () =>
      editingChildId
        ? ((children ?? []).find(c => c.id === editingChildId) ?? null)
        : null,
    [editingChildId, children]
  );

  const { pendingOpen, consume } = useChildrenSheetStore();

  useEffect(() => {
    if (pendingOpen) {
      consume();
      setChildrenSheetVisible(true);
    }
  }, [pendingOpen, consume]);

  const handleChildrenPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setChildrenSheetVisible(true);
  }, []);

  // Clic sur un enfant dans la sheet liste → ouvre EditChildSheet
  const handleSelectChild = useCallback((child: Child) => {
    setChildrenSheetVisible(false);
    setTimeout(() => setEditingChildId(child.id), 300);
  }, []);

  // Clic sur un enfant dans la section guardians → ouvre EditChildSheet
  const handleChildSectionPress = useCallback((child: Child) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingChildId(child.id);
  }, []);

  const handleAddChildFromSheet = useCallback(() => {
    setChildrenSheetVisible(false);
    setTimeout(() => nav.goToParentChildAdd(), 250);
  }, [nav]);

  const handleDeleteChild = useCallback(
    (childId: string) => {
      const child = children?.find(c => c.id === childId);
      deleteChild.mutate(childId, {
        onSuccess: () => {
          setEditingChildId(null);
          Toast.show(`${child?.first_name ?? "L'enfant"} a été supprimé(e)`, {
            type: 'success',
            duration: 3000,
          });
        },
        onError: () => {
          Toast.show("Impossible de supprimer l'enfant", { type: 'error' });
        },
      });
    },
    [children, deleteChild]
  );

  const handleAddGuardian = useCallback(
    (childId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      nav.goToParentGuardianAdd(childId);
    },
    [nav]
  );

  const handleEditGuardian = useCallback(
    (guardianId: string, childId: string) => {
      nav.goToParentGuardianEdit(guardianId, childId);
    },
    [nav]
  );

  if (isError) return <QueryError onRetry={refetch} />;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* Header */}
      <Animated.View
        entering={FadeInDown.duration(350)}
        style={{
          backgroundColor: theme.card,
          borderBottomWidth: 1,
          borderBottomColor: theme.cardBorder,
          paddingTop: insets.top + 16,
          paddingBottom: 14,
          paddingHorizontal: 20,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
          }}
        >
          <View>
            <Text
              style={{
                color: theme.textMuted,
                fontSize: 11,
                fontWeight: '700',
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              Personnes autorisées
            </Text>
            <Text
              style={{
                color: theme.text,
                fontSize: 26,
                fontWeight: '800',
                letterSpacing: -0.5,
              }}
            >
              Collecteurs
            </Text>
          </View>

          {/* Bouton enfants dynamique */}
          <TouchableOpacity
            onPress={handleChildrenPress}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor:
                childrenCount === 0 ? theme.accent : theme.primaryBg,
              borderRadius: 14,
              paddingVertical: 10,
              paddingHorizontal: 14,
            }}
          >
            <MaterialCommunityIcons
              name={childrenCount === 0 ? 'account-plus' : 'account-group'}
              size={15}
              color={childrenCount === 0 ? '#fff' : theme.primary}
            />
            <Text
              style={{
                color: childrenCount === 0 ? '#fff' : theme.primary,
                fontWeight: '700',
                fontSize: 13,
              }}
            >
              {childrenCount === 0
                ? 'Ajouter un enfant'
                : `${childrenCount} enfant${childrenCount > 1 ? 's' : ''}`}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Content */}
      {isLoading ? (
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <ActivityIndicator color={theme.accent} size="large" />
        </View>
      ) : childrenCount === 0 ? (
        /* Empty state — no children */
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 32,
          }}
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 28,
              backgroundColor: theme.primaryBg,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}
          >
            <MaterialCommunityIcons
              name="shield-account-outline"
              size={40}
              color={theme.primary}
            />
          </View>
          <Text
            style={{
              color: theme.text,
              fontSize: 18,
              fontWeight: '800',
              textAlign: 'center',
              marginBottom: 10,
            }}
          >
            Aucun enfant enregistré
          </Text>
          <Text
            style={{
              color: theme.textMuted,
              fontSize: 14,
              textAlign: 'center',
              lineHeight: 21,
              marginBottom: 28,
            }}
          >
            Ajoutez votre premier enfant pour commencer à gérer ses collecteurs
            et autorisations.
          </Text>
          <TouchableOpacity
            onPress={() => nav.goToParentChildAdd()}
            style={{
              backgroundColor: theme.accent,
              borderRadius: 16,
              paddingVertical: 14,
              paddingHorizontal: 28,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <MaterialCommunityIcons
              name="account-plus"
              size={18}
              color="#fff"
            />
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
              Ajouter un enfant
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* List of children + their guardians */
        <ScrollView
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + 100,
          }}
          showsVerticalScrollIndicator={false}
        >
          {(children ?? []).map((child, i) => (
            <ChildGuardianSection
              key={child.id}
              child={child}
              sectionIndex={i}
              onAddGuardian={handleAddGuardian}
              onEditGuardian={handleEditGuardian}
              onChildPress={handleChildSectionPress}
            />
          ))}
        </ScrollView>
      )}

      {/* Children picker sheet (dynamique) */}
      {childrenCount > 0 ? (
        <ChildrenPickerSheet
          visible={childrenSheetVisible}
          children={children ?? []}
          onClose={() => setChildrenSheetVisible(false)}
          onSelectChild={handleSelectChild}
          onAddChild={handleAddChildFromSheet}
        />
      ) : (
        <AddFirstChildSheet
          visible={childrenSheetVisible}
          onClose={() => setChildrenSheetVisible(false)}
          onAdd={handleAddChildFromSheet}
        />
      )}

      {/* Edit child modal */}
      <SheetModal
        visible={editingChild !== null}
        onRequestClose={() => setEditingChildId(null)}
      >
        {editingChild ? (
          <EditChildSheet
            key={`${editingChild.id}-${editingChild.updated_at}`}
            child={editingChild}
            onClose={() => setEditingChildId(null)}
            onDelete={handleDeleteChild}
          />
        ) : null}
      </SheetModal>
    </View>
  );
}
