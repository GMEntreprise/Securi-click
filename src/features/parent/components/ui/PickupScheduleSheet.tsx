import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SheetModal } from '@/shared/ui/molecules/SheetModal';
import Animated, { FadeInDown, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Toast } from '@/shared/ui/molecules/Toast';
import { useTranslation } from 'react-i18next';
import {
  usePickupAuthorization,
  useUpsertPickupAuthorization,
} from '../../hooks/usePickupAuthorization';
import type { TimeWindow } from '../../services/pickupAuthorization.service';

interface Props {
  visible: boolean;
  childId: string;
  guardianId: string;
  guardianName: string;
  onClose: () => void;
}

type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

const HOUR_OPTIONS = Array.from({ length: 14 }, (_, i) => {
  const h = i + 7;
  return {
    label: `${String(h).padStart(2, '0')}h00`,
    value: `${String(h).padStart(2, '0')}:00`,
  };
});

const DEFAULT_WINDOWS: TimeWindow[] = [{ start: '16:00', end: '18:00' }];

// ─── Sélecteur d'heure simple ─────────────────────────────────────────────────
const HourPicker = memo(function HourPicker({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  const t = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <Text
        style={{
          color: t.textMuted,
          fontSize: 10,
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: 0.6,
          marginBottom: 6,
        }}
      >
        {label}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 6 }}
      >
        {HOUR_OPTIONS.map(opt => {
          const active = opt.value === value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onChange(opt.value);
              }}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 10,
                backgroundColor: active ? t.accent : t.iconBg,
                borderWidth: 1,
                borderColor: active ? t.accent : t.cardBorder,
              }}
            >
              <Text
                style={{
                  color: active ? '#fff' : t.textSecondary,
                  fontSize: 13,
                  fontWeight: '700',
                }}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
});

// ─── Ligne d'une plage horaire ────────────────────────────────────────────────
const TimeWindowRow = memo(function TimeWindowRow({
  window: win,
  index,
  canDelete,
  onChange,
  onDelete,
}: {
  window: TimeWindow;
  index: number;
  canDelete: boolean;
  onChange: (index: number, field: 'start' | 'end', value: string) => void;
  onDelete: (index: number) => void;
}) {
  const t = useTheme();
  const { t: i18n } = useTranslation('parent');
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 40).duration(260)}
      style={{
        backgroundColor: t.iconBg,
        borderRadius: 16,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: t.cardBorder,
        gap: 12,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 7,
              backgroundColor: t.accentBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="time-outline" size={11} color={t.accent} />
          </View>
          <Text style={{ color: t.text, fontSize: 13, fontWeight: '700' }}>
            {i18n('schedule_window_label', { index: index + 1 })}
          </Text>
        </View>
        {canDelete && (
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onDelete(index);
            }}
            style={{ padding: 4 }}
          >
            <Ionicons name="trash-outline" size={15} color={t.red} />
          </TouchableOpacity>
        )}
      </View>
      <HourPicker
        label={i18n('schedule_hour_start')}
        value={win.start}
        onChange={v => onChange(index, 'start', v)}
      />
      <HourPicker
        label={i18n('schedule_hour_end')}
        value={win.end}
        onChange={v => onChange(index, 'end', v)}
      />
    </Animated.View>
  );
});

// ─── Main ─────────────────────────────────────────────────────────────────────
export const PickupScheduleSheet = memo(function PickupScheduleSheet({
  visible,
  childId,
  guardianId,
  guardianName,
  onClose,
}: Props) {
  const t = useTheme();
  const { t: i18n } = useTranslation('parent');
  const insets = useSafeAreaInsets();

  const DAYS = useMemo(
    () => [
      { key: 'monday' as DayKey, label: i18n('schedule_day_mon') },
      { key: 'tuesday' as DayKey, label: i18n('schedule_day_tue') },
      { key: 'wednesday' as DayKey, label: i18n('schedule_day_wed') },
      { key: 'thursday' as DayKey, label: i18n('schedule_day_thu') },
      { key: 'friday' as DayKey, label: i18n('schedule_day_fri') },
    ],
    [i18n]
  );

  const REMINDER_OPTIONS = useMemo(
    () => [
      { label: i18n('schedule_reminder_15'), value: 15 },
      { label: i18n('schedule_reminder_30'), value: 30 },
      { label: i18n('schedule_reminder_60'), value: 60 },
    ],
    [i18n]
  );

  const { data: existing, isLoading } = usePickupAuthorization(
    childId,
    guardianId
  );
  const upsert = useUpsertPickupAuthorization();

  const [days, setDays] = useState<Record<DayKey, boolean>>({
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
  });
  const [windows, setWindows] = useState<TimeWindow[]>(DEFAULT_WINDOWS);
  const [reminder, setReminder] = useState(30);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!visible) return;
    if (existing) {
      setDays({
        monday: existing.monday,
        tuesday: existing.tuesday,
        wednesday: existing.wednesday,
        thursday: existing.thursday,
        friday: existing.friday,
      });
      setWindows(
        existing.time_windows && existing.time_windows.length > 0
          ? existing.time_windows
          : [
              {
                start: existing.start_time?.slice(0, 5) ?? '16:00',
                end: existing.end_time?.slice(0, 5) ?? '18:00',
              },
            ]
      );
      setReminder(existing.reminder_before ?? 30);
      setIsActive(existing.is_active);
    } else {
      setDays({
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
      });
      setWindows(DEFAULT_WINDOWS);
      setReminder(30);
      setIsActive(true);
    }
  }, [visible, existing]);

  const toggleDay = useCallback((key: DayKey) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDays(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const updateWindow = useCallback(
    (index: number, field: 'start' | 'end', value: string) => {
      setWindows(prev =>
        prev.map((w, i) => (i === index ? { ...w, [field]: value } : w))
      );
    },
    []
  );

  const addWindow = useCallback(() => {
    if (windows.length >= 3) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setWindows(prev => [...prev, { start: '19:00', end: '20:00' }]);
  }, [windows.length]);

  const deleteWindow = useCallback((index: number) => {
    setWindows(prev => prev.filter((_, i) => i !== index));
  }, []);

  const hasAnyDay = useMemo(() => Object.values(days).some(Boolean), [days]);

  const handleSave = useCallback(async () => {
    if (!hasAnyDay) {
      Toast.show(i18n('schedule_days_warning'), {
        type: 'error',
        duration: 2500,
      });
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const result = await upsert.mutateAsync({
        child_id: childId,
        guardian_id: guardianId,
        ...days,
        time_windows: windows,
        reminder_before: reminder,
        is_active: isActive,
      });
      if (!result.success)
        throw new Error(result.error ?? i18n('schedule_save_error'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show(i18n('schedule_save_success'), {
        type: 'success',
        duration: 2500,
      });
      onClose();
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show(i18n('schedule_save_error'), {
        type: 'error',
        duration: 3000,
      });
    }
  }, [
    hasAnyDay,
    childId,
    guardianId,
    days,
    windows,
    reminder,
    isActive,
    upsert,
    onClose,
    i18n,
  ]);

  return (
    <SheetModal visible={visible} onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        {/* Handle */}
        <View
          style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}
        >
          <View
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: t.cardBorder,
            }}
          />
        </View>

        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 12,
          }}
        >
          <View>
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: t.textMuted,
                textTransform: 'uppercase',
                letterSpacing: 1.2,
                marginBottom: 2,
              }}
            >
              {i18n('schedule_title')}
            </Text>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '800',
                color: t.text,
                letterSpacing: -0.3,
              }}
            >
              {guardianName}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              backgroundColor: t.iconBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="close" size={16} color={t.textMuted} />
          </TouchableOpacity>
        </Animated.View>

        {isLoading ? (
          <View
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <ActivityIndicator color={t.accent} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingBottom: insets.bottom + 100,
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Statut actif / désactivé */}
            <Animated.View
              entering={FadeInDown.delay(40).duration(280)}
              style={{ marginBottom: 20 }}
            >
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {[true, false].map(val => {
                  const active = isActive === val;
                  return (
                    <TouchableOpacity
                      key={String(val)}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setIsActive(val);
                      }}
                      style={{
                        flex: 1,
                        paddingVertical: 12,
                        borderRadius: 14,
                        backgroundColor: active
                          ? val
                            ? t.greenBg
                            : t.redBg
                          : t.iconBg,
                        borderWidth: 1.5,
                        borderColor: active
                          ? val
                            ? t.green
                            : t.red
                          : t.cardBorder,
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontWeight: '700',
                          fontSize: 14,
                          color: active ? (val ? t.green : t.red) : t.textMuted,
                        }}
                      >
                        {val
                          ? i18n('schedule_active')
                          : i18n('schedule_inactive')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Animated.View>

            {/* Jours */}
            <Animated.View
              entering={FadeInDown.delay(80).duration(280)}
              style={{ marginBottom: 20 }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 9,
                    backgroundColor: t.accentBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={14}
                    color={t.accent}
                  />
                </View>
                <Text
                  style={{ color: t.text, fontSize: 15, fontWeight: '700' }}
                >
                  {i18n('schedule_days_label')}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {DAYS.map(({ key, label }) => {
                  const active = days[key];
                  return (
                    <TouchableOpacity
                      key={key}
                      onPress={() => toggleDay(key)}
                      style={{
                        flex: 1,
                        paddingVertical: 14,
                        borderRadius: 14,
                        backgroundColor: active ? t.accent : t.card,
                        borderWidth: 1.5,
                        borderColor: active ? t.accent : t.cardBorder,
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: '800',
                          color: active ? '#fff' : t.textMuted,
                        }}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {!hasAnyDay && (
                <Text
                  style={{
                    color: t.amber,
                    fontSize: 12,
                    marginTop: 8,
                    fontWeight: '600',
                  }}
                >
                  {i18n('schedule_days_warning')}
                </Text>
              )}
            </Animated.View>

            {/* Plages horaires */}
            <Animated.View
              entering={FadeInDown.delay(120).duration(280)}
              style={{ marginBottom: 20 }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}
              >
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                >
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 9,
                      backgroundColor: t.accentBg,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="time-outline" size={14} color={t.accent} />
                  </View>
                  <Text
                    style={{ color: t.text, fontSize: 15, fontWeight: '700' }}
                  >
                    {i18n('schedule_hours_label')}
                  </Text>
                </View>
                {windows.length < 3 && (
                  <TouchableOpacity
                    onPress={addWindow}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                      backgroundColor: t.accentBg,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 10,
                    }}
                  >
                    <Ionicons name="add" size={13} color={t.accent} />
                    <Text
                      style={{
                        color: t.accent,
                        fontSize: 12,
                        fontWeight: '700',
                      }}
                    >
                      {i18n('schedule_add_window')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              {windows.map((win, i) => (
                <TimeWindowRow
                  key={i}
                  window={win}
                  index={i}
                  canDelete={windows.length > 1}
                  onChange={updateWindow}
                  onDelete={deleteWindow}
                />
              ))}
            </Animated.View>

            {/* Rappel */}
            <Animated.View
              entering={FadeInDown.delay(160).duration(280)}
              style={{ marginBottom: 28 }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 9,
                    backgroundColor: t.amberBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons
                    name="notifications-outline"
                    size={14}
                    color={t.amber}
                  />
                </View>
                <Text
                  style={{ color: t.text, fontSize: 15, fontWeight: '700' }}
                >
                  {i18n('schedule_reminder_label')}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {REMINDER_OPTIONS.map(opt => {
                  const active = reminder === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setReminder(opt.value);
                      }}
                      style={{
                        flex: 1,
                        paddingVertical: 12,
                        borderRadius: 14,
                        backgroundColor: active ? t.amberBg : t.card,
                        borderWidth: 1.5,
                        borderColor: active ? t.amber : t.cardBorder,
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: '700',
                          color: active ? t.amber : t.textMuted,
                        }}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Animated.View>
          </ScrollView>
        )}

        {/* CTA */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 16,
            paddingTop: 14,
            backgroundColor: t.ctaBg,
            borderTopWidth: 1,
            borderTopColor: t.ctaBorder,
          }}
        >
          <TouchableOpacity
            onPress={handleSave}
            disabled={upsert.isPending || !hasAnyDay}
            style={{
              backgroundColor: hasAnyDay ? t.accent : t.cardBorder,
              borderRadius: 18,
              paddingVertical: 16,
              alignItems: 'center',
              opacity: upsert.isPending ? 0.7 : 1,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
              {upsert.isPending
                ? i18n('schedule_cta_saving')
                : i18n('schedule_cta_save')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SheetModal>
  );
});
