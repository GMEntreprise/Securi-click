import React, { memo, useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ShieldCheck, ShieldOff, Building2, Calendar, ChevronRight } from 'lucide-react-native';
import { Avatar } from '@/shared/ui/base/avatar';
import { useTheme } from '@/theme';
import { useMyGuardians } from '@/features/collector/hooks/useCollector';
import { AccessDetailSheet } from '@/features/collector/components/ui/AccessDetailSheet';
import type { CollectorGuardian } from '@/features/collector/types';

export default function CollectorAccessScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { data: guardians, isLoading } = useMyGuardians();
  const [selected, setSelected] = useState<CollectorGuardian | null>(null);

  const grouped = useMemo(() => {
    if (!guardians) return { active: [], inactive: [] };
    return {
      active: guardians.filter(g => g.is_active),
      inactive: guardians.filter(g => !g.is_active),
    };
  }, [guardians]);

  const handleOpen = useCallback((g: CollectorGuardian) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(g);
  }, []);

  const handleClose = useCallback(() => setSelected(null), []);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <AccessDetailSheet guardian={selected} onClose={handleClose} />

      <Animated.View
        entering={FadeInDown.duration(400)}
        style={{
          backgroundColor: theme.card,
          borderBottomWidth: 1,
          borderBottomColor: theme.cardBorder,
          paddingTop: insets.top + 16,
          paddingBottom: 14,
          paddingHorizontal: 20,
        }}
      >
        <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 2 }}>
          Autorisations
        </Text>
        <Text style={{ color: theme.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 }}>
          Mes accès
        </Text>
      </Animated.View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <ActivityIndicator color={theme.accent} style={{ marginTop: 40 }} />
        ) : !guardians || guardians.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 60, gap: 12 }}>
            <ShieldOff size={44} color={theme.textMuted} strokeWidth={1.5} />
            <Text style={{ color: theme.textMuted, fontSize: 15, fontWeight: '600', textAlign: 'center' }}>
              Aucune autorisation reçue.{'\n'}Demandez au parent de vous inviter.
            </Text>
          </View>
        ) : (
          <>
            {grouped.active.length > 0 && (
              <Animated.View entering={FadeInDown.delay(60).duration(300)}>
                <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, paddingHorizontal: 4 }}>
                  Accès actifs
                </Text>
                <View style={{ gap: 10, marginBottom: 20 }}>
                  {grouped.active.map((g, i) => (
                    <AccessCard key={g.id} guardian={g} index={i} onPress={handleOpen} />
                  ))}
                </View>
              </Animated.View>
            )}
            {grouped.inactive.length > 0 && (
              <Animated.View entering={FadeInDown.delay(120).duration(300)}>
                <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, paddingHorizontal: 4 }}>
                  Accès suspendus
                </Text>
                <View style={{ gap: 10 }}>
                  {grouped.inactive.map((g, i) => (
                    <AccessCard key={g.id} guardian={g} index={i} suspended onPress={handleOpen} />
                  ))}
                </View>
              </Animated.View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const AccessCard = memo(function AccessCard({
  guardian,
  index,
  suspended = false,
  onPress,
}: {
  guardian: CollectorGuardian;
  index: number;
  suspended?: boolean;
  onPress: (g: CollectorGuardian) => void;
}) {
  const theme = useTheme();
  const child = guardian.child;
  const childName = child
    ? `${child.first_name ?? ''} ${child.last_name ?? ''}`.trim()
    : '—';

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(280)}>
      <TouchableOpacity
        onPress={() => onPress(guardian)}
        activeOpacity={0.75}
        style={{
          backgroundColor: theme.card,
          borderRadius: 20,
          borderWidth: 1.5,
          borderColor: suspended ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)',
          overflow: 'hidden',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'stretch' }}>
          {/* Barre latérale colorée */}
          <View style={{ width: 4, backgroundColor: suspended ? '#ef4444' : '#10b981' }} />

          <View style={{ flex: 1, padding: 14 }}>
            {/* Ligne enfant + badge */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Avatar
                image={{ uri: child?.photo_url ?? '', name: childName }}
                size={44}
                showBorder={false}
                backgroundColor={theme.accentBg}
                textColor={theme.accent}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontWeight: '700', fontSize: 15 }}>
                  {childName}
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 1 }}>
                  {guardian.relationship || '—'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{
                  backgroundColor: suspended ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
                  borderRadius: 10,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                }}>
                  {suspended
                    ? <ShieldOff size={12} color="#ef4444" strokeWidth={2.5} />
                    : <ShieldCheck size={12} color="#10b981" strokeWidth={2.5} />
                  }
                  <Text style={{ color: suspended ? '#ef4444' : '#10b981', fontSize: 11, fontWeight: '700' }}>
                    {suspended ? 'Suspendu' : 'Actif'}
                  </Text>
                </View>
                <ChevronRight size={14} color={theme.textMuted} strokeWidth={2} />
              </View>
            </View>

            {/* École + date */}
            <View style={{ gap: 5 }}>
              {child?.school ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Building2 size={12} color={theme.textMuted} />
                  <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                    {child.school.name}{child.school.city ? `, ${child.school.city}` : ''}
                  </Text>
                </View>
              ) : null}
              {child?.class_name ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: theme.accentBg, alignItems: 'center', justifyContent: 'center' }}>
                    <View style={{ width: 5, height: 5, borderRadius: 1.5, backgroundColor: theme.accent }} />
                  </View>
                  <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                    {child.class_name}
                  </Text>
                </View>
              ) : null}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Calendar size={12} color={theme.textMuted} />
                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                  Depuis le {new Date(guardian.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
              </View>
            </View>

            {suspended && (
              <View style={{ backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: 10, padding: 10, marginTop: 10 }}>
                <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: '600' }}>
                  Votre accès a été suspendu par le parent. Contactez-le pour rétablir l'autorisation.
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});
