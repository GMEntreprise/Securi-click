import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import {
  useGlobalConnectivity,
  type ConnectivityStatus,
} from '@/hooks/useGlobalConnectivity';

const DURATION = 280;

interface BannerConfig {
  messageKey: string;
  color: string;
  bg: string;
  iconName: 'wifi-outline' | 'cloud-offline-outline' | 'refresh-outline';
  showRetry: boolean;
}

const CONFIG: Record<Exclude<ConnectivityStatus, 'online'>, BannerConfig> = {
  offline: {
    messageKey: 'network_offline',
    color: '#ffffff',
    bg: '#1a1a2e',
    iconName: 'wifi-outline',
    showRetry: true,
  },
  realtime_disconnected: {
    messageKey: 'network_sync_pending',
    color: '#ffffff',
    bg: '#7c3aed',
    iconName: 'cloud-offline-outline',
    showRetry: true,
  },
  reconnecting: {
    messageKey: 'network_reconnecting',
    color: '#ffffff',
    bg: '#0f766e',
    iconName: 'refresh-outline',
    showRetry: false,
  },
};

export function NetworkBanner() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('common');
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

  const { messageKey, color, bg, iconName, showRetry } = CONFIG[status];
  const message = t(messageKey);

  return (
    <Animated.View
      style={[
        styles.banner,
        { backgroundColor: bg, paddingTop: insets.top + 6 },
        animStyle,
      ]}
      accessibilityLiveRegion="polite"
      accessibilityLabel={message}
    >
      <Ionicons name={iconName} size={16} color={color} />
      <Text style={[styles.message, { color }]}>{message}</Text>

      {showRetry && (
        <TouchableOpacity
          onPress={retry}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={t('retry')}
          style={[styles.retryBtn, { borderColor: `${color}50` }]}
        >
          <Ionicons name="refresh-outline" size={10} color={color} />
          <Text style={[styles.retryText, { color }]}>{t('retry')}</Text>
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
