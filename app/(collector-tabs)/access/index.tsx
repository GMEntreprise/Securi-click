import React, { useMemo } from 'react';
import { View, Text, ScrollView, Image, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ShieldCheck,
  ShieldOff,
  User,
  Calendar,
  Building2,
} from 'lucide-react-native';
import { useTheme } from '@/theme';
import { useMyGuardians } from '@/features/collector/hooks/useCollector';

export default function CollectorAccessScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { data: guardians, isLoading } = useMyGuardians();

  const grouped = useMemo(() => {
    if (!guardians) return { active: [], inactive: [] };
    return {
      active: guardians.filter(g => g.is_active),
      inactive: guardians.filter(g => !g.is_active),
    };
  }, [guardians]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
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
          Autorisations
        </Text>
        <Text
          style={{
            color: theme.text,
            fontSize: 26,
            fontWeight: '800',
            letterSpacing: -0.5,
          }}
        >
          Mes accès
        </Text>
      </Animated.View>

      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <ActivityIndicator color={theme.accent} style={{ marginTop: 40 }} />
        ) : guardians?.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 60, gap: 12 }}>
            <ShieldOff size={44} color={theme.textMuted} strokeWidth={1.5} />
            <Text
              style={{
                color: theme.textMuted,
                fontSize: 15,
                fontWeight: '600',
                textAlign: 'center',
              }}
            >
              Aucune autorisation reçue.{'\n'}Demandez au parent de vous
              inviter.
            </Text>
          </View>
        ) : (
          <>
            {grouped.active.length > 0 && (
              <Animated.View entering={FadeInDown.delay(60).duration(300)}>
                <Text
                  style={{
                    color: theme.textMuted,
                    fontSize: 11,
                    fontWeight: '700',
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    marginBottom: 10,
                    paddingHorizontal: 4,
                  }}
                >
                  Accès actifs
                </Text>
                <View style={{ gap: 10, marginBottom: 20 }}>
                  {grouped.active.map((g, i) => (
                    <AccessCard key={g.id} guardian={g} index={i} />
                  ))}
                </View>
              </Animated.View>
            )}
            {grouped.inactive.length > 0 && (
              <Animated.View entering={FadeInDown.delay(120).duration(300)}>
                <Text
                  style={{
                    color: theme.textMuted,
                    fontSize: 11,
                    fontWeight: '700',
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    marginBottom: 10,
                    paddingHorizontal: 4,
                  }}
                >
                  Accès suspendus
                </Text>
                <View style={{ gap: 10 }}>
                  {grouped.inactive.map((g, i) => (
                    <AccessCard key={g.id} guardian={g} index={i} suspended />
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

function AccessCard({
  guardian,
  index,
  suspended = false,
}: {
  guardian: import('@/features/collector/types').CollectorGuardian;
  index: number;
  suspended?: boolean;
}) {
  const theme = useTheme();
  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(280)}>
      <View
        style={{
          backgroundColor: theme.card,
          borderRadius: 20,
          borderWidth: 1.5,
          borderColor: suspended
            ? 'rgba(239,68,68,0.2)'
            : 'rgba(16,185,129,0.2)',
          overflow: 'hidden',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'stretch' }}>
          <View
            style={{
              width: 4,
              backgroundColor: suspended ? '#ef4444' : '#10b981',
            }}
          />
          <View style={{ flex: 1, padding: 14 }}>
            {/* Child info */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                marginBottom: 12,
              }}
            >
              {guardian.child?.photo_url ? (
                <Image
                  source={{ uri: guardian.child.photo_url }}
                  style={{ width: 40, height: 40, borderRadius: 12 }}
                />
              ) : (
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
                  <User size={18} color={theme.accent} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text
                  style={{ color: theme.text, fontWeight: '700', fontSize: 15 }}
                >
                  {guardian.child?.first_name} {guardian.child?.last_name}
                </Text>
                <Text
                  style={{ color: theme.textMuted, fontSize: 12, marginTop: 1 }}
                >
                  {guardian.relationship}
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: suspended
                    ? 'rgba(239,68,68,0.12)'
                    : 'rgba(16,185,129,0.12)',
                  borderRadius: 10,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                {suspended ? (
                  <ShieldOff size={12} color="#ef4444" strokeWidth={2.5} />
                ) : (
                  <ShieldCheck size={12} color="#10b981" strokeWidth={2.5} />
                )}
                <Text
                  style={{
                    color: suspended ? '#ef4444' : '#10b981',
                    fontSize: 11,
                    fontWeight: '700',
                  }}
                >
                  {suspended ? 'Suspendu' : 'Actif'}
                </Text>
              </View>
            </View>

            {/* School + date */}
            <View style={{ gap: 6 }}>
              {guardian.child?.school ? (
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                >
                  <Building2 size={13} color={theme.textMuted} />
                  <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                    {guardian.child.school.name}, {guardian.child.school.city}
                  </Text>
                </View>
              ) : null}
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
              >
                <Calendar size={13} color={theme.textMuted} />
                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                  Depuis le{' '}
                  {new Date(guardian.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            </View>

            {suspended && (
              <View
                style={{
                  backgroundColor: 'rgba(239,68,68,0.08)',
                  borderRadius: 10,
                  padding: 10,
                  marginTop: 10,
                }}
              >
                <Text
                  style={{ color: '#ef4444', fontSize: 12, fontWeight: '600' }}
                >
                  Votre accès a été suspendu par le parent. Contactez-le pour
                  rétablir l'autorisation.
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}
