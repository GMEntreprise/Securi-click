import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme } from '@/theme';

export default function CallbackScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: t.bg,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: insets.bottom,
      }}
    >
      <Animated.View
        entering={FadeIn.duration(300)}
        style={{ alignItems: 'center', gap: 20 }}
      >
        <Text style={{ fontSize: 48 }}>🔐</Text>
        <ActivityIndicator size="large" color={t.accent} />
        <View style={{ alignItems: 'center', gap: 6 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '700',
              color: t.text,
              letterSpacing: -0.3,
            }}
          >
            Connexion en cours…
          </Text>
          <Text style={{ fontSize: 14, color: t.textSecondary }}>
            Vérification de votre lien d'accès
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}
