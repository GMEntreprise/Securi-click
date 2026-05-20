import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WifiOff, RefreshCw, CloudOff } from 'lucide-react-native';
import { useGlobalConnectivity, type ConnectivityStatus } from '@/hooks/useGlobalConnectivity';

const DURATION = 280;

interface BannerConfig {
  message: string;
  color: string;
  bg: string;
  Icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
  showRetry: boolean;
}

const CONFIG: Record<Exclude<ConnectivityStatus, 'online'>, BannerConfig> = {
  offline: {
    message: 'Aucune connexion réseau',
    color: '#ffffff',
    bg: '#1a1a2e',
    Icon: WifiOff,
    showRetry: true,
  },
  realtime_disconnected: {
    message: 'Synchronisation en attente',
    color: '#ffffff',
    bg: '#7c3aed',
    Icon: CloudOff,
    showRetry: true,
  },
  reconnecting: {
    message: 'Reconnexion en cours…',
    color: '#ffffff',
    bg: '#0f766e',
    Icon: RefreshCw,
    showRetry: false,
  },
};

export function NetworkBanner() {
  const insets = useSafeAreaInsets();
  const { status, retry } = useGlobalConnectivity();
  const visible = status !== 'online';
  const translateY = useSharedValue(-60);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: DURATION });
      opacity.value = withTiming(1, { duration: DURATION });
    } else {
      translateY.value = withTiming(-60, { duration: DURATION });
      opacity.value = withTiming(0, { duration: DURATION });
    }
  }, [visible, translateY, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (status === 'online') return null;

  const { message, color, bg, Icon, showRetry } = CONFIG[status];

  return (
    <Animated.View
      style={[styles.banner, { backgroundColor: bg, paddingTop: insets.top + 6 }, animStyle]}
      accessibilityLiveRegion="polite"
      accessibilityLabel={message}
    >
      <Icon size={16} color={color} strokeWidth={2.5} />
      <Text style={[styles.message, { color }]}>{message}</Text>

      {showRetry && (
        <TouchableOpacity
          onPress={retry}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Réessayer"
          style={[styles.retryBtn, { borderColor: `${color}50` }]}
        >
          <RefreshCw size={10} color={color} strokeWidth={2.5} />
          <Text style={[styles.retryText, { color }]}>Réessayer</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 10,
    paddingHorizontal: 16,
    gap: 8,
  },
  message: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
    flex: 1,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
