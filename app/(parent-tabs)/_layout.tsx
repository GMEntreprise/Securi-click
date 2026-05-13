import React, { useCallback } from 'react';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Home, Users, QrCode, Clock, User } from 'lucide-react-native';
import { CurvedBottomTabs } from '@/shared/ui/base/curved-bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import type { CurvedTabBarNavigationProps } from '@/shared/ui/base/curved-bottom-tabs/types';

const LIGHT_GRADIENTS = ['#f97316', '#ea580c'] as const;
const DARK_GRADIENTS = ['#1e3a8a', '#1d4ed8'] as const;

const ICON_SIZE = 22;

function ThemedCurvedTabBar(
  props: BottomTabBarProps & CurvedTabBarNavigationProps
) {
  const scheme = useColorScheme();
  const gradients =
    scheme === 'dark' ? [...DARK_GRADIENTS] : [...LIGHT_GRADIENTS];

  return (
    <CurvedBottomTabs
      {...props}
      gradients={gradients}
      activeColor="#ffffff"
      inactiveColor={scheme === 'dark' ? '#6b7280' : '#9ca3af'}
      labelColor={scheme === 'dark' ? '#6b7280' : '#9ca3af'}
      barHeight={9}
      buttonScale={6}
      textSize={11}
      animation={{ damping: 14, stiffness: 130, mass: 0.6 }}
    />
  );
}

export default function ParentTabsLayout() {
  const renderTabBar = useCallback(
    (props: BottomTabBarProps) => <ThemedCurvedTabBar {...props} />,
    []
  );

  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={renderTabBar}>
      <Tabs.Screen
        name="index"
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
        name="children"
        options={{
          title: 'Enfants',
          tabBarIcon: ({ focused, color }) => (
            <Users
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
