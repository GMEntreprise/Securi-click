import React, { useCallback } from 'react';
import { Tabs } from 'expo-router';
import { Home, Users, ScanLine, Clock, User } from 'lucide-react-native';
import { CurvedBottomTabs } from '@/shared/ui/base/curved-bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import type { CurvedTabBarNavigationProps } from '@/shared/ui/base/curved-bottom-tabs/types';
import { useTheme } from '@/theme';

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

export default function SchoolTabsLayout() {
  const renderTabBar = useCallback(
    (props: BottomTabBarProps) => <ThemedCurvedTabBar {...props} />,
    []
  );

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={renderTabBar}
    >
      <Tabs.Screen
        name="home/index"
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
        name="students/index"
        options={{
          title: 'Élèves',
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
        name="scanner/index"
        options={{
          title: 'Scanner',
          tabBarIcon: ({ focused, color }) => (
            <ScanLine
              size={ICON_SIZE}
              color={color}
              strokeWidth={focused ? 2.5 : 1.8}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history/index"
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
