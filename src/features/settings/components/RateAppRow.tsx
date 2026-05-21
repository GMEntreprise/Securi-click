import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme';
import { useStoreReview } from '../hooks/useStoreReview';

export function RateAppRow({ isLast = false }: { isLast?: boolean }) {
  const theme = useTheme();
  const { reviewState, request } = useStoreReview();

  const isDone = reviewState === 'done';
  const isBlocked = reviewState === 'blocked';
  const isBusy = reviewState === 'requesting';

  const iconName: React.ComponentProps<typeof Ionicons>['name'] = isDone
    ? 'checkmark-circle-outline'
    : isBlocked
      ? 'time-outline'
      : 'star-outline';

  const iconColor = isDone ? theme.green : isBlocked ? theme.amber : '#f59e0b';

  const iconBg = isDone
    ? theme.greenBg
    : isBlocked
      ? theme.amberBg
      : 'rgba(245,158,11,0.12)';

  const label = isDone
    ? 'Merci pour votre soutien !'
    : isBlocked
      ? 'Vous avez déjà donné votre avis récemment'
      : "Noter l'application";

  const subtitle = isDone
    ? 'Votre avis compte énormément'
    : isBlocked
      ? 'Revenez dans quelques semaines'
      : 'Votre avis nous aide à améliorer SecuriClick';

  const handlePress = () => {
    if (isBusy || isDone || isBlocked) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    request();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={isBusy || isDone || isBlocked ? 1 : 0.7}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 13,
        paddingHorizontal: 16,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: theme.separator,
      }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 11,
          backgroundColor: iconBg,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        {isBusy ? (
          <ActivityIndicator size="small" color={iconColor} />
        ) : (
          <Ionicons name={iconName} size={16} color={iconColor} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.text, fontSize: 15, fontWeight: '600' }}>
          {label}
        </Text>
        <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 1 }}>
          {subtitle}
        </Text>
      </View>
      {!isDone && !isBlocked && !isBusy && (
        <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
      )}
    </TouchableOpacity>
  );
}
