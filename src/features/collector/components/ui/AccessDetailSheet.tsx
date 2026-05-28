import React, { memo } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SheetModal } from '@/shared/ui/molecules/SheetModal';
import Animated, { FadeInDown, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Avatar } from '@/shared/ui/base/avatar';
import type { CollectorGuardian } from '@/features/collector/types';
import { usePickupAuthorization } from '@/features/parent/hooks/usePickupAuthorization';
import {
  getActiveDayLabels,
  formatTimeWindows,
  getNextPickupLabel,
} from '@/features/collector/hooks/usePickupSchedule';

interface Props {
  guardian: CollectorGuardian | null;
  onClose: () => void;
}

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
          backgroundColor: theme.iconBg,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 1,
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 11,
            fontWeight: '600',
            color: theme.textMuted,
            textTransform: 'uppercase',
            letterSpacing: 0.6,
            marginBottom: 2,
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: theme.text,
            lineHeight: 20,
          }}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

export const AccessDetailSheet = memo(function AccessDetailSheet({
  guardian,
  onClose,
}: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const { data: pickupAuth } = usePickupAuthorization(
    guardian?.child?.id ?? '',
    guardian?.id ?? ''
  );

  if (!guardian) return null;

  const child = guardian.child;
  const childName = child
    ? `${child.first_name} ${child.last_name}`.trim()
    : '—';
  const isActive = guardian.is_active;
  const activeDays = pickupAuth ? getActiveDayLabels(pickupAuth) : [];
  const timeLabel = pickupAuth ? formatTimeWindows(pickupAuth) : null;
  const nextLabel = pickupAuth ? getNextPickupLabel(pickupAuth) : null;

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <SheetModal visible={!!guardian} onRequestClose={handleClose}>
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
                color: theme.textMuted,
                textTransform: 'uppercase',
                letterSpacing: 1.2,
                marginBottom: 2,
              }}
            >
              Détail accès
            </Text>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '800',
                color: theme.text,
                letterSpacing: -0.3,
              }}
            >
              {childName}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              backgroundColor: theme.iconBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="close" size={16} color={theme.textMuted} />
          </TouchableOpacity>
        </Animated.View>

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 40,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar + statut */}
          <Animated.View
            entering={SlideInDown.delay(60).duration(350)}
            style={{ alignItems: 'center', marginBottom: 24 }}
          >
            <Avatar
              image={{ uri: child?.photo_url ?? '', name: childName }}
              size={88}
              showBorder
              borderColor={isActive ? '#10b981' : '#ef4444'}
              borderWidth={3}
              backgroundColor={theme.accentBg}
              textColor={theme.accent}
            />
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                marginTop: 12,
                backgroundColor: isActive
                  ? 'rgba(16,185,129,0.12)'
                  : 'rgba(239,68,68,0.12)',
                paddingHorizontal: 14,
                paddingVertical: 5,
                borderRadius: 20,
              }}
            >
              {isActive ? (
                <Ionicons name="shield-checkmark" size={13} color="#10b981" />
              ) : (
                <Ionicons name="shield-outline" size={13} color="#ef4444" />
              )}
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: isActive ? '#10b981' : '#ef4444',
                }}
              >
                {isActive ? 'Accès actif' : 'Accès suspendu'}
              </Text>
            </View>
          </Animated.View>

          {/* Infos enfant */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(300)}
            style={{
              backgroundColor: theme.card,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: theme.cardBorder,
              paddingHorizontal: 16,
              marginBottom: 12,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingTop: 14,
                paddingBottom: 8,
              }}
            >
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 8,
                  backgroundColor: theme.accentBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name="person-outline"
                  size={13}
                  color={theme.accent}
                />
              </View>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: theme.textSecondary,
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                }}
              >
                Enfant
              </Text>
            </View>
            <View
              style={{
                height: 1,
                backgroundColor: theme.separator,
                marginBottom: 4,
              }}
            />

            <InfoRow
              icon={
                <Ionicons
                  name="person-outline"
                  size={14}
                  color={theme.textMuted}
                />
              }
              label="Prénom & Nom"
              value={childName || '—'}
            />
            {child?.class_name ? (
              <InfoRow
                icon={
                  <Ionicons
                    name="school-outline"
                    size={14}
                    color={theme.textMuted}
                  />
                }
                label="Classe"
                value={child.class_name}
              />
            ) : null}
            {child?.school ? (
              <InfoRow
                icon={
                  <Ionicons
                    name="business-outline"
                    size={14}
                    color={theme.textMuted}
                  />
                }
                label="Établissement"
                value={`${child.school.name}${child.school.city ? `, ${child.school.city}` : ''}`}
              />
            ) : null}
            {child?.school?.address ? (
              <InfoRow
                icon={
                  <Ionicons
                    name="location-outline"
                    size={14}
                    color={theme.textMuted}
                  />
                }
                label="Adresse"
                value={`${child.school.address}${child.school.postal_code ? `, ${child.school.postal_code}` : ''}${child.school.city ? ` ${child.school.city}` : ''}`}
              />
            ) : null}
          </Animated.View>

          {/* Infos autorisation */}
          <Animated.View
            entering={FadeInDown.delay(140).duration(300)}
            style={{
              backgroundColor: theme.card,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: theme.cardBorder,
              paddingHorizontal: 16,
              marginBottom: 12,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingTop: 14,
                paddingBottom: 8,
              }}
            >
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 8,
                  backgroundColor: theme.primaryBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name="heart-outline"
                  size={13}
                  color={theme.primary}
                />
              </View>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: theme.textSecondary,
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                }}
              >
                Autorisation
              </Text>
            </View>
            <View
              style={{
                height: 1,
                backgroundColor: theme.separator,
                marginBottom: 4,
              }}
            />

            <InfoRow
              icon={
                <Ionicons
                  name="person-outline"
                  size={14}
                  color={theme.textMuted}
                />
              }
              label="Relation"
              value={guardian.relationship || '—'}
            />
            <InfoRow
              icon={
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color={theme.textMuted}
                />
              }
              label="Autorisé depuis"
              value={new Date(guardian.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            />
          </Animated.View>

          {/* Planning de récupération */}
          {pickupAuth && (
            <Animated.View
              entering={FadeInDown.delay(160).duration(300)}
              style={{
                backgroundColor: theme.card,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: theme.cardBorder,
                paddingHorizontal: 16,
                marginBottom: 12,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingTop: 14,
                  paddingBottom: 8,
                }}
              >
                <View
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    backgroundColor: theme.accentBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={13}
                    color={theme.accent}
                  />
                </View>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: theme.textSecondary,
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                  }}
                >
                  Planning
                </Text>
                <View
                  style={{
                    marginLeft: 'auto',
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 8,
                    backgroundColor: pickupAuth.is_active
                      ? theme.greenBg
                      : theme.redBg,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: '700',
                      color: pickupAuth.is_active ? theme.green : theme.red,
                    }}
                  >
                    {pickupAuth.is_active ? 'Actif' : 'Désactivé'}
                  </Text>
                </View>
              </View>
              <View
                style={{
                  height: 1,
                  backgroundColor: theme.separator,
                  marginBottom: 8,
                }}
              />

              {/* Prochain pickup */}
              {nextLabel && (
                <View
                  style={{
                    backgroundColor: theme.accentBg,
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Ionicons
                    name="time-outline"
                    size={14}
                    color={theme.accent}
                  />
                  <Text
                    style={{
                      color: theme.accent,
                      fontSize: 13,
                      fontWeight: '700',
                      flex: 1,
                    }}
                  >
                    {nextLabel}
                  </Text>
                </View>
              )}

              {/* Jours */}
              {activeDays.length > 0 && (
                <View style={{ paddingBottom: 10 }}>
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: '600',
                      color: theme.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: 0.6,
                      marginBottom: 8,
                    }}
                  >
                    Jours autorisés
                  </Text>
                  <View
                    style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}
                  >
                    {activeDays.map(day => (
                      <View
                        key={day}
                        style={{
                          backgroundColor: theme.iconBg,
                          borderRadius: 8,
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          borderWidth: 1,
                          borderColor: theme.cardBorder,
                        }}
                      >
                        <Text
                          style={{
                            color: theme.text,
                            fontSize: 12,
                            fontWeight: '700',
                          }}
                        >
                          {day}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Horaires */}
              {timeLabel && (
                <View style={{ paddingBottom: 14 }}>
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: '600',
                      color: theme.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: 0.6,
                      marginBottom: 6,
                    }}
                  >
                    Horaires
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Ionicons
                      name="time-outline"
                      size={12}
                      color={theme.textMuted}
                    />
                    <Text
                      style={{
                        color: theme.text,
                        fontSize: 13,
                        fontWeight: '600',
                      }}
                    >
                      {timeLabel}
                    </Text>
                  </View>
                </View>
              )}
            </Animated.View>
          )}

          {/* Notes médicales */}
          {child?.medical_notes ? (
            <Animated.View
              entering={FadeInDown.delay(180).duration(300)}
              style={{
                backgroundColor: theme.amberBg,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: 'rgba(245,158,11,0.25)',
                paddingHorizontal: 16,
                marginBottom: 12,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingTop: 14,
                  paddingBottom: 8,
                }}
              >
                <View
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    backgroundColor: 'rgba(245,158,11,0.2)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons
                    name="alert-circle-outline"
                    size={13}
                    color={theme.amber}
                  />
                </View>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: theme.amber,
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                  }}
                >
                  Notes médicales
                </Text>
              </View>
              <View
                style={{
                  height: 1,
                  backgroundColor: 'rgba(245,158,11,0.2)',
                  marginBottom: 12,
                }}
              />
              <Text
                style={{
                  fontSize: 14,
                  color: theme.text,
                  lineHeight: 22,
                  paddingBottom: 16,
                }}
              >
                {child.medical_notes}
              </Text>
            </Animated.View>
          ) : null}

          {/* Avertissement si suspendu */}
          {!isActive && (
            <Animated.View
              entering={FadeInDown.delay(220).duration(300)}
              style={{
                backgroundColor: 'rgba(239,68,68,0.08)',
                borderRadius: 14,
                padding: 14,
                borderWidth: 1,
                borderColor: 'rgba(239,68,68,0.2)',
              }}
            >
              <Text
                style={{
                  color: '#ef4444',
                  fontSize: 13,
                  fontWeight: '600',
                  lineHeight: 20,
                }}
              >
                Votre accès a été suspendu par le parent responsable.
                Contactez-le directement pour rétablir l'autorisation.
              </Text>
            </Animated.View>
          )}
        </ScrollView>
      </View>
    </SheetModal>
  );
});
