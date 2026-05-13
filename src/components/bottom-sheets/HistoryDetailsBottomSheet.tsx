import React, { memo, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  X,
  CheckCircle,
  XCircle,
  MinusCircle,
  Pin,
  Calendar,
  QrCode,
  User,
  School,
} from 'lucide-react-native';
import { useTheme } from '@/theme';
import {
  useHistoryDetail,
  usePinEntry,
} from '@/features/parent/hooks/useHistory';

interface Props {
  entryId: string | null;
  onClose: () => void;
}

const STATUS_CFG = {
  completed: {
    Icon: CheckCircle,
    color: '#10b981',
    bg: 'rgba(16,185,129,0.12)',
    label: 'Validé',
  },
  denied: {
    Icon: XCircle,
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.12)',
    label: 'Refusé',
  },
  cancelled: {
    Icon: MinusCircle,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
    label: 'Annulé',
  },
} as const;

function InfoRow({
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
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 10,
        gap: 12,
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          backgroundColor: 'rgba(0,0,0,0.05)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: theme.textMuted,
            fontSize: 11,
            fontWeight: '600',
            marginBottom: 2,
          }}
        >
          {label}
        </Text>
        <Text style={{ color: theme.text, fontSize: 14, fontWeight: '500' }}>
          {value}
        </Text>
      </View>
    </View>
  );
}

export const HistoryDetailsBottomSheet = memo(
  function HistoryDetailsBottomSheet({ entryId, onClose }: Props) {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const { data: detail, isLoading } = useHistoryDetail(entryId);
    const pinMutation = usePinEntry();

    const handlePin = useCallback(() => {
      if (!detail) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      pinMutation.mutate({ entryId: detail.id, pinned: !detail.is_pinned });
    }, [detail, pinMutation]);

    if (!entryId) return null;

    const cfg = detail
      ? (STATUS_CFG[detail.status] ?? STATUS_CFG.cancelled)
      : null;
    const StatusIcon = cfg?.Icon ?? null;

    return (
      <Modal
        visible={!!entryId}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
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
                backgroundColor: theme.cardBorder,
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
              paddingBottom: 14,
              borderBottomWidth: 1,
              borderBottomColor: theme.cardBorder,
            }}
          >
            <Text
              style={{ color: theme.text, fontSize: 18, fontWeight: '800' }}
            >
              Détail de l'événement
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {detail && (
                <TouchableOpacity
                  onPress={handlePin}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    backgroundColor: detail.is_pinned
                      ? theme.accentBg
                      : theme.iconBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Pin
                    size={16}
                    color={detail.is_pinned ? theme.accent : theme.textMuted}
                    fill={detail.is_pinned ? theme.accent : 'none'}
                  />
                </TouchableOpacity>
              )}
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
                <X size={18} color={theme.text} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={{
              padding: 20,
              paddingBottom: insets.bottom + 40,
            }}
            showsVerticalScrollIndicator={false}
          >
            {isLoading || !detail ? (
              <ActivityIndicator
                color={theme.accent}
                style={{ marginTop: 40 }}
              />
            ) : (
              <Animated.View entering={FadeInDown.duration(300)}>
                {/* Status banner */}
                <Animated.View
                  entering={SlideInDown.duration(300)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    backgroundColor: cfg!.bg,
                    borderRadius: 16,
                    padding: 14,
                    marginBottom: 20,
                  }}
                >
                  {StatusIcon && (
                    <StatusIcon
                      size={22}
                      color={cfg!.color}
                      strokeWidth={2.5}
                    />
                  )}
                  <View>
                    <Text
                      style={{
                        color: cfg!.color,
                        fontWeight: '800',
                        fontSize: 16,
                      }}
                    >
                      {cfg!.label}
                    </Text>
                    <Text
                      style={{ color: cfg!.color, fontSize: 12, opacity: 0.8 }}
                    >
                      {new Date(detail.scanned_at).toLocaleString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </Text>
                  </View>
                </Animated.View>

                {/* Enfant + Collecteur photos */}
                {(detail.child?.photo_url || detail.guardian?.photo_url) && (
                  <View
                    style={{
                      flexDirection: 'row',
                      gap: 12,
                      marginBottom: 20,
                    }}
                  >
                    {detail.child?.photo_url && (
                      <View style={{ alignItems: 'center', flex: 1 }}>
                        <Image
                          source={{ uri: detail.child.photo_url }}
                          style={{
                            width: 64,
                            height: 64,
                            borderRadius: 20,
                            marginBottom: 6,
                          }}
                        />
                        <Text style={{ color: theme.textMuted, fontSize: 11 }}>
                          Enfant
                        </Text>
                      </View>
                    )}
                    {detail.guardian?.photo_url && (
                      <View style={{ alignItems: 'center', flex: 1 }}>
                        <Image
                          source={{ uri: detail.guardian.photo_url }}
                          style={{
                            width: 64,
                            height: 64,
                            borderRadius: 20,
                            marginBottom: 6,
                          }}
                        />
                        <Text style={{ color: theme.textMuted, fontSize: 11 }}>
                          Collecteur
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Info rows */}
                <View
                  style={{
                    backgroundColor: theme.card,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: theme.cardBorder,
                    paddingHorizontal: 14,
                    marginBottom: 14,
                  }}
                >
                  <InfoRow
                    icon={<User size={15} color={theme.textMuted} />}
                    label="Enfant"
                    value={
                      detail.child
                        ? `${detail.child.first_name} ${detail.child.last_name}`
                        : '—'
                    }
                  />
                  <View
                    style={{ height: 1, backgroundColor: theme.separator }}
                  />
                  <InfoRow
                    icon={<User size={15} color={theme.textMuted} />}
                    label="Collecteur"
                    value={
                      detail.guardian
                        ? `${detail.guardian.first_name} ${detail.guardian.last_name} · ${detail.guardian.relationship}`
                        : '—'
                    }
                  />
                  {detail.school && (
                    <>
                      <View
                        style={{ height: 1, backgroundColor: theme.separator }}
                      />
                      <InfoRow
                        icon={<School size={15} color={theme.textMuted} />}
                        label="Établissement"
                        value={`${detail.school.name}, ${detail.school.city}`}
                      />
                    </>
                  )}
                  {detail.staff && (
                    <>
                      <View
                        style={{ height: 1, backgroundColor: theme.separator }}
                      />
                      <InfoRow
                        icon={<User size={15} color={theme.textMuted} />}
                        label="Validé par"
                        value={`${detail.staff.first_name} ${detail.staff.last_name}`}
                      />
                    </>
                  )}
                  <View
                    style={{ height: 1, backgroundColor: theme.separator }}
                  />
                  <InfoRow
                    icon={<Calendar size={15} color={theme.textMuted} />}
                    label="Heure exacte"
                    value={new Date(detail.scanned_at).toISOString()}
                  />
                  {detail.qr_jti && (
                    <>
                      <View
                        style={{ height: 1, backgroundColor: theme.separator }}
                      />
                      <InfoRow
                        icon={<QrCode size={15} color={theme.textMuted} />}
                        label="QR ID"
                        value={detail.qr_jti}
                      />
                    </>
                  )}
                </View>

                {/* Denial reason */}
                {detail.denial_reason && (
                  <View
                    style={{
                      backgroundColor: theme.redBg,
                      borderRadius: 14,
                      padding: 14,
                      marginBottom: 14,
                    }}
                  >
                    <Text
                      style={{
                        color: theme.red,
                        fontSize: 13,
                        fontWeight: '600',
                      }}
                    >
                      Motif de refus
                    </Text>
                    <Text
                      style={{ color: theme.red, fontSize: 14, marginTop: 4 }}
                    >
                      {detail.denial_reason}
                    </Text>
                  </View>
                )}
              </Animated.View>
            )}
          </ScrollView>
        </View>
      </Modal>
    );
  }
);
