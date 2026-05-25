import React, { memo, useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { useMySchool } from '@/features/school/hooks/useSchool';
import { usePickupValidations } from '@/features/school/hooks/useValidations';
import { Avatar } from '@/shared/ui/base/avatar';
import type {
  PickupValidation,
  CollectorIdentityStatus,
  ValidationStatus,
} from '@/features/school/types';

type FilterKey = 'all' | ValidationStatus;

type GroupedItem =
  | { type: 'header'; date: string; key: string }
  | { type: 'row'; item: PickupValidation; key: string };

function groupByDay(items: PickupValidation[]): GroupedItem[] {
  const result: GroupedItem[] = [];
  let lastDay = '';
  for (const item of items) {
    const day = new Date(item.scanned_at).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    if (day !== lastDay) {
      lastDay = day;
      result.push({ type: 'header', date: day, key: `header-${day}` });
    }
    result.push({ type: 'row', item, key: item.id });
  }
  return result;
}

export default function SchoolHistoryScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [selected, setSelected] = useState<PickupValidation | null>(null);
  const [filter, setFilter] = useState<FilterKey>('all');

  const { data: school } = useMySchool();
  const schoolId = school?.id ?? '';
  const { data: validations, isLoading } = usePickupValidations(schoolId);

  const counts = useMemo(() => {
    const all = validations ?? [];
    return {
      all: all.length,
      validated: all.filter(v => v.status === 'validated').length,
      refused: all.filter(v => v.status === 'refused').length,
    };
  }, [validations]);

  const filtered = useMemo(() => {
    if (filter === 'all') return validations ?? [];
    return (validations ?? []).filter(v => v.status === filter);
  }, [validations, filter]);

  const grouped = useMemo(() => groupByDay(filtered), [filtered]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<GroupedItem>) => {
      if (item.type === 'header') {
        return (
          <Text
            style={{
              color: theme.textMuted,
              fontSize: 12,
              fontWeight: '700',
              letterSpacing: 0.8,
              textTransform: 'uppercase',
              paddingHorizontal: 20,
              paddingTop: 20,
              paddingBottom: 8,
            }}
          >
            {item.date}
          </Text>
        );
      }
      return (
        <HistoryRow
          item={item.item}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSelected(item.item);
          }}
        />
      );
    },
    [theme]
  );

  const keyExtractor = useCallback((item: GroupedItem) => item.key, []);

  if (isLoading && !validations) {
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
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={{
            paddingTop: insets.top + 20,
            paddingHorizontal: 20,
            paddingBottom: 4,
          }}
        >
          <Text
            style={{
              color: theme.text,
              fontSize: 24,
              fontWeight: '800',
              letterSpacing: -0.5,
            }}
          >
            Historique
          </Text>
          <Text style={{ color: theme.textMuted, fontSize: 14, marginTop: 4 }}>
            {filtered.length} enregistrement{filtered.length > 1 ? 's' : ''}
          </Text>
        </Animated.View>

        {/* Filter chips */}
        <Animated.View
          entering={FadeInDown.delay(60).duration(300)}
          style={{
            flexDirection: 'row',
            gap: 8,
            paddingHorizontal: 20,
            paddingTop: 14,
            paddingBottom: 8,
          }}
        >
          <FilterChip
            label="Tous"
            count={counts.all}
            active={filter === 'all'}
            onPress={() => setFilter('all')}
          />
          <FilterChip
            label="Validés"
            count={counts.validated}
            active={filter === 'validated'}
            onPress={() => setFilter('validated')}
            activeColor="green"
          />
          <FilterChip
            label="Refusés"
            count={counts.refused}
            active={filter === 'refused'}
            onPress={() => setFilter('refused')}
            activeColor="red"
          />
        </Animated.View>

        {!grouped.length ? (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingBottom: 100,
            }}
          >
            <Ionicons name="time-outline" size={48} color={theme.textMuted} />
            <Text
              style={{
                color: theme.textMuted,
                fontSize: 16,
                marginTop: 16,
                textAlign: 'center',
              }}
            >
              {filter === 'all'
                ? 'Aucune validation enregistrée'
                : filter === 'validated'
                  ? 'Aucune validation réussie'
                  : 'Aucun refus enregistré'}
            </Text>
          </View>
        ) : (
          <FlashList
            data={grouped}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            getItemType={item => item.type}
            contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          />
        )}
      </View>

      <Modal
        visible={!!selected}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelected(null)}
      >
        {selected && (
          <ValidationDetailSheet
            item={selected}
            onClose={() => setSelected(null)}
          />
        )}
      </Modal>
    </>
  );
}

const FilterChip = memo(function FilterChip({
  label,
  count,
  active,
  onPress,
  activeColor = 'accent',
}: {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
  activeColor?: 'green' | 'red' | 'accent';
}) {
  const theme = useTheme();

  const colorMap = {
    green: { bg: theme.greenBg, text: theme.green, border: theme.green },
    red: { bg: theme.redBg, text: theme.red, border: theme.red },
    accent: { bg: theme.accentBg, text: theme.accent, border: theme.accent },
  };

  const colors = active ? colorMap[activeColor] : null;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1.5,
        backgroundColor: active ? colors!.bg : theme.card,
        borderColor: active ? colors!.border : theme.cardBorder,
      }}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: '700',
          color: active ? colors!.text : theme.textSecondary,
        }}
      >
        {label}
      </Text>
      <View
        style={{
          minWidth: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: active ? colors!.text : theme.inputBorder,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 4,
        }}
      >
        <Text
          style={{
            fontSize: 11,
            fontWeight: '800',
            color: active ? colors!.bg : theme.textMuted,
          }}
        >
          {count > 999 ? '999+' : count}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

const HistoryRow = memo(function HistoryRow({
  item,
  onPress,
}: {
  item: PickupValidation;
  onPress: () => void;
}) {
  const theme = useTheme();
  const isOk = item.status === 'validated';
  const color = isOk ? theme.green : theme.red;
  const bg = isOk ? theme.greenBg : theme.redBg;
  const time = new Date(item.scanned_at).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 12,
      }}
    >
      <Avatar
        image={{
          uri: item.child?.photo_url ?? '',
          name: `${item.child?.first_name ?? ''} ${item.child?.last_name ?? ''}`.trim(),
        }}
        size={44}
        showBorder={false}
        backgroundColor={theme.primaryBg}
        textColor={theme.primary}
      />
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.text, fontSize: 14, fontWeight: '700' }}>
          {item.child?.first_name} {item.child?.last_name}
        </Text>
        {item.guardian ? (
          <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 1 }}>
            {item.guardian.first_name} {item.guardian.last_name} ·{' '}
            {item.guardian.relationship}
          </Text>
        ) : (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              marginTop: 2,
            }}
          >
            <Avatar
              image={{
                uri: '',
                name: `${item.child?.parent?.first_name ?? ''} ${item.child?.parent?.last_name ?? ''}`.trim(),
              }}
              size={18}
              showBorder={false}
              backgroundColor={theme.primaryBg}
              textColor={theme.primary}
            />
            <Text style={{ color: theme.textMuted, fontSize: 12 }}>
              {item.child?.parent
                ? `${item.child.parent.first_name} ${item.child.parent.last_name} · Parent`
                : 'QR Parent'}
            </Text>
          </View>
        )}
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 8,
            backgroundColor: bg,
          }}
        >
          <Text style={{ color, fontSize: 11, fontWeight: '700' }}>
            {isOk ? 'Validé' : 'Refusé'}
          </Text>
        </View>
        <Text style={{ color: theme.textMuted, fontSize: 11 }}>{time}</Text>
      </View>
      <Ionicons name="chevron-forward" size={14} color={theme.textMuted} />
    </TouchableOpacity>
  );
});

const IdentityBadgeInline = memo(function IdentityBadgeInline({
  status,
}: {
  status: CollectorIdentityStatus | undefined;
}) {
  const theme = useTheme();

  const cfg = {
    verified: {
      iconName: 'shield-checkmark' as const,
      color: theme.green,
      bg: theme.greenBg,
      label: 'Identité vérifiée',
    },
    pending: {
      iconName: 'time-outline' as const,
      color: theme.amber,
      bg: theme.amberBg,
      label: 'Vérification en attente',
    },
    refused: {
      iconName: 'shield-outline' as const,
      color: theme.red,
      bg: theme.redBg,
      label: 'Identité refusée',
    },
    expired: {
      iconName: 'shield-outline' as const,
      color: theme.red,
      bg: theme.redBg,
      label: 'Identité expirée',
    },
    none: {
      iconName: 'warning-outline' as const,
      color: theme.amber,
      bg: theme.amberBg,
      label: 'Identité non vérifiée',
    },
  };

  const key = (status ?? 'none') as keyof typeof cfg;
  const { iconName, color, bg, label } = cfg[key] ?? cfg.none;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: bg,
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 5,
        alignSelf: 'flex-start',
        marginTop: 6,
      }}
    >
      <Ionicons name={iconName} size={12} color={color} />
      <Text style={{ color, fontSize: 11, fontWeight: '700' }}>{label}</Text>
    </View>
  );
});

const ValidationDetailSheet = memo(function ValidationDetailSheet({
  item,
  onClose,
}: {
  item: PickupValidation;
  onClose: () => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const isOk = item.status === 'validated';
  const color = isOk ? theme.green : theme.red;
  const bg = isOk ? theme.greenBg : theme.redBg;

  const dateStr = new Date(item.scanned_at).toLocaleString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* Handle */}
      <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
        <View
          style={{
            width: 40,
            height: 4,
            borderRadius: 2,
            backgroundColor: theme.inputBorder,
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
          paddingVertical: 12,
        }}
      >
        <Text style={{ color: theme.text, fontSize: 20, fontWeight: '800' }}>
          Détail
        </Text>
        <TouchableOpacity
          onPress={onClose}
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            backgroundColor: theme.iconBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="close" size={18} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        <View style={{ paddingHorizontal: 20, gap: 16 }}>
          {/* Status */}
          <View
            style={{
              padding: 16,
              borderRadius: 20,
              backgroundColor: bg,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            {isOk ? (
              <Ionicons name="checkmark-circle" size={28} color={color} />
            ) : (
              <Ionicons name="close-circle" size={28} color={color} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ color, fontSize: 16, fontWeight: '800' }}>
                {isOk ? 'Validation réussie' : 'Accès refusé'}
              </Text>
              {!isOk && item.refusal_reason && (
                <Text
                  style={{ color, fontSize: 13, marginTop: 2, opacity: 0.85 }}
                >
                  {item.refusal_reason}
                </Text>
              )}
            </View>
          </View>

          {/* Date */}
          <DetailRow
            icon={
              <Ionicons name="time-outline" size={16} color={theme.textMuted} />
            }
            label="Date et heure"
            value={dateStr}
          />

          {/* Child */}
          {item.child && (
            <View
              style={{
                backgroundColor: theme.card,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: theme.cardBorder,
                padding: 16,
              }}
            >
              <SectionTitle
                icon={
                  <Ionicons
                    name="person-outline"
                    size={14}
                    color={theme.primary}
                  />
                }
                label="Enfant"
                bg={theme.primaryBg}
              />
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}
              >
                <Avatar
                  image={{
                    uri: item.child.photo_url ?? '',
                    name: `${item.child.first_name} ${item.child.last_name}`,
                  }}
                  size={56}
                  showBorder={false}
                  backgroundColor={theme.primaryBg}
                  textColor={theme.primary}
                />
                <View>
                  <Text
                    style={{
                      color: theme.text,
                      fontSize: 16,
                      fontWeight: '800',
                    }}
                  >
                    {item.child.first_name} {item.child.last_name}
                  </Text>
                  {item.child.class_name && (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 5,
                        marginTop: 4,
                      }}
                    >
                      <Ionicons
                        name="school-outline"
                        size={13}
                        color={theme.textMuted}
                      />
                      <Text style={{ color: theme.textMuted, fontSize: 13 }}>
                        {item.child.class_name}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Guardian or Parent fallback */}
          {item.guardian ? (
            <View
              style={{
                backgroundColor: theme.card,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: theme.cardBorder,
                padding: 16,
              }}
            >
              <SectionTitle
                icon={
                  <Ionicons
                    name="person-outline"
                    size={14}
                    color={theme.accent}
                  />
                }
                label="Collecteur"
                bg={theme.accentBg}
              />
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}
              >
                <Avatar
                  image={{
                    uri: item.guardian.photo_url ?? '',
                    name: `${item.guardian.first_name} ${item.guardian.last_name}`,
                  }}
                  size={56}
                  showBorder={false}
                  backgroundColor={theme.accentBg}
                  textColor={theme.accent}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: theme.text,
                      fontSize: 16,
                      fontWeight: '800',
                    }}
                  >
                    {item.guardian.first_name} {item.guardian.last_name}
                  </Text>
                  <Text
                    style={{
                      color: theme.textMuted,
                      fontSize: 13,
                      marginTop: 2,
                    }}
                  >
                    {item.guardian.relationship}
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                      marginTop: 4,
                    }}
                  >
                    <Ionicons
                      name="call-outline"
                      size={13}
                      color={theme.textMuted}
                    />
                    <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                      {item.guardian.phone}
                    </Text>
                  </View>
                  <IdentityBadgeInline status={item.guardian.identity_status} />
                </View>
              </View>
            </View>
          ) : item.child?.parent ? (
            <View
              style={{
                backgroundColor: theme.card,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: theme.cardBorder,
                padding: 16,
              }}
            >
              <SectionTitle
                icon={
                  <Ionicons
                    name="home-outline"
                    size={14}
                    color={theme.primary}
                  />
                }
                label="Parent"
                bg={theme.primaryBg}
              />
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}
              >
                <Avatar
                  image={{
                    uri: '',
                    name: `${item.child.parent.first_name} ${item.child.parent.last_name}`,
                  }}
                  size={56}
                  showBorder={false}
                  backgroundColor={theme.primaryBg}
                  textColor={theme.primary}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: theme.text,
                      fontSize: 16,
                      fontWeight: '800',
                    }}
                  >
                    {item.child.parent.first_name} {item.child.parent.last_name}
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      marginTop: 6,
                      backgroundColor: theme.primaryBg,
                      borderRadius: 8,
                      paddingHorizontal: 8,
                      paddingVertical: 5,
                      alignSelf: 'flex-start',
                    }}
                  >
                    <Ionicons
                      name="qr-code-outline"
                      size={12}
                      color={theme.primary}
                    />
                    <Text
                      style={{
                        color: theme.primary,
                        fontSize: 11,
                        fontWeight: '700',
                      }}
                    >
                      QR parent direct
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
});

function SectionTitle({
  icon,
  label,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  bg: string;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 14,
      }}
    >
      <View
        style={{
          width: 26,
          height: 26,
          borderRadius: 8,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </View>
      <Text style={{ color: theme.text, fontSize: 14, fontWeight: '700' }}>
        {label}
      </Text>
    </View>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        backgroundColor: theme.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.cardBorder,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
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
            fontWeight: '600',
            marginTop: 2,
          }}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}
