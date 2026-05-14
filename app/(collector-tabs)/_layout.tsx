import React, { useCallback } from 'react';
import { Tabs } from 'expo-router';
import { Home, Shield, QrCode, Clock, User } from 'lucide-react-native';
import { CurvedBottomTabs } from '@/shared/ui/base/curved-bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import type { CurvedTabBarNavigationProps } from '@/shared/ui/base/curved-bottom-tabs/types';
import { useTheme } from '@/theme';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';

const ICON_SIZE = 22;

function ThemedCurvedTabBar(
  props: BottomTabBarProps & CurvedTabBarNavigationProps
) {
  const t = useTheme();
  return (
    <CurvedBottomTabs
      {...props}
      gradients={[...t.tabGradient]}
      activeColor="#ffffff"
      inactiveColor={t.textMuted}
      labelColor={t.textMuted}
      barHeight={9}
      buttonScale={6}
      textSize={11}
      animation={{ damping: 14, stiffness: 130, mass: 0.6 }}
    />
  );
}

export default function CollectorTabsLayout() {
  const renderTabBar = useCallback(
    (props: BottomTabBarProps) => <ThemedCurvedTabBar {...props} />,
    []
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTransparent: true,
        headerTitle: '',
        headerRight: () => <NotificationBell />,
        headerStyle: { backgroundColor: 'transparent' },
      }}
      tabBar={renderTabBar}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ focused, color }) => (
            <Home
              size={ICON_SIZE}
              color={color}
              strokeWidth={focused ? 2.5 : 1.8}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="access"
        options={{
          title: 'Mes accès',
          tabBarIcon: ({ focused, color }) => (
            <Shield
              size={ICON_SIZE}
              color={color}
              strokeWidth={focused ? 2.5 : 1.8}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="qr"
        options={{
          title: 'QR Code',
          tabBarIcon: ({ focused, color }) => (
            <QrCode
              size={ICON_SIZE}
              color={color}
              strokeWidth={focused ? 2.5 : 1.8}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historique',
          tabBarIcon: ({ focused, color }) => (
            <Clock
              size={ICON_SIZE}
              color={color}
              strokeWidth={focused ? 2.5 : 1.8}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused, color }) => (
            <User
              size={ICON_SIZE}
              color={color}
              strokeWidth={focused ? 2.5 : 1.8}
            />
          ),
        }}
      />
    </Tabs>
  );
}
