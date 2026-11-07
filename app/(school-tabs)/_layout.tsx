import React, { useCallback } from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { CurvedBottomTabs } from '@/shared/ui/base/curved-bottom-tabs';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import type { CurvedTabBarNavigationProps } from '@/shared/ui/base/curved-bottom-tabs/types';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { tabIconColor } from '@/constants/tabBar';

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
  const { t } = useTranslation('common');
  const renderTabBar = useCallback(
    (props: BottomTabBarProps) => <ThemedCurvedTabBar {...props} />,
    []
  );

  return (
    <>
      <Tabs screenOptions={{ headerShown: false }} tabBar={renderTabBar}>
        <Tabs.Screen
          name="home"
          options={{
            title: t('tab_home'),
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons
                name="home-outline"
                size={ICON_SIZE}
                color={tabIconColor(color)}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="students"
          options={{
            title: t('tab_students'),
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons
                name="account-group"
                size={ICON_SIZE}
                color={tabIconColor(color)}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="scanner"
          options={{
            title: t('tab_scanner'),
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons
                name="line-scan"
                size={ICON_SIZE}
                color={tabIconColor(color)}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: t('tab_history'),
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons
                name="history"
                size={ICON_SIZE}
                color={tabIconColor(color)}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t('tab_profile'),
            tabBarIcon: ({ color }) => (
              <Ionicons
                name="person-outline"
                size={ICON_SIZE}
                color={tabIconColor(color)}
              />
            ),
          }}
        />
      </Tabs>
    </>
  );
}
