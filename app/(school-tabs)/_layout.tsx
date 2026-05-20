import React, { useCallback } from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { CurvedBottomTabs } from '@/shared/ui/base/curved-bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import type { CurvedTabBarNavigationProps } from '@/shared/ui/base/curved-bottom-tabs/types';
import { useTheme } from '@/theme';

const ICON_SIZE = 24;

function ThemedCurvedTabBar(
  props: BottomTabBarProps & CurvedTabBarNavigationProps
) {
  const t = useTheme();
  return (
    <CurvedBottomTabs
      {...props}
      gradients={[...t.tabGradient]}
      activeColor="#ffffff"
      inactiveColor="rgba(255,255,255,0.70)"
      labelColor="rgba(255,255,255,0.70)"
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
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="home-outline" size={ICON_SIZE} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="students/index"
        options={{
          title: 'Élèves',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="account-group" size={ICON_SIZE} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="scanner/index"
        options={{
          title: 'Scanner',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="line-scan" size={ICON_SIZE} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history/index"
        options={{
          title: 'Historique',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="history" size={ICON_SIZE} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" size={ICON_SIZE} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
