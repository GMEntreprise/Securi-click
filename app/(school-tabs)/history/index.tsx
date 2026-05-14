import React, { memo, useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Phone,
  GraduationCap,
  X,
  ChevronRight,
} from 'lucide-react-native';
import { useTheme } from '@/theme';
import { useMySchool } from '@/features/school/hooks/useSchool';
import { usePickupValidations } from '@/features/school/hooks/useValidations';
import { Avatar } from '@/shared/ui/base/avatar';
import type { PickupValidation } from '@/features/school/types';

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

  const { data: school } = useMySchool();
  const schoolId = school?.id ?? '';
  const { data: validations, isLoading } = usePickupValidations(schoolId);

  const grouped = useMemo(() => groupByDay(validations ?? []), [validations]);

  const renderItem = useCallback(
    ({ item }: { item: GroupedItem }) => {
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
            paddingBottom: 12,
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
            {validations?.length ?? 0} enregistrement
            {(validations?.length ?? 0) > 1 ? 's' : ''}
          </Text>
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
            <Clock size={48} color={theme.textMuted} strokeWidth={1.2} />
            <Text
              style={{
                color: theme.textMuted,
                fontSize: 16,
                marginTop: 16,
                textAlign: 'center',
              }}
            >
              Aucune validation enregistrée
            </Text>
          </View>
        ) : (
          <FlashList
            data={grouped as GroupedItem[]}
            renderItem={renderItem as any}
            keyExtractor={keyExtractor as any}
            getItemType={(item: GroupedItem) => item.type}
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
        <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 1 }}>
          {item.guardian
            ? `${item.guardian.first_name} ${item.guardian.last_name}`
            : 'Parent direct'}
        </Text>
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
      <ChevronRight size={14} color={theme.textMuted} />
    </TouchableOpacity>
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
          <X size={18} color={theme.textSecondary} />
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
              <CheckCircle2 size={28} color={color} strokeWidth={2} />
            ) : (
              <XCircle size={28} color={color} strokeWidth={2} />
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
            icon={<Clock size={16} color={theme.textMuted} />}
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
                icon={<User size={14} color={theme.primary} />}
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
                      <GraduationCap size={13} color={theme.textMuted} />
                      <Text style={{ color: theme.textMuted, fontSize: 13 }}>
                        {item.child.class_name}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Guardian */}
          {item.guardian && (
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
                icon={<User size={14} color={theme.accent} />}
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
                    <Phone size={13} color={theme.textMuted} />
                    <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                      {item.guardian.phone}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
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
