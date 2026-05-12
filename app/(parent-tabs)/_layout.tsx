import React, { useMemo } from 'react';
import { Tabs } from 'expo-router';
import { Platform, Pressable, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { 
  Home, 
  Users, 
  QrCode, 
  Clock, 
  User,
  Bell 
} from 'lucide-react-native';

// Context for tab bar visibility
export const TabBarVisibilityContext = React.createContext<{
  setVisible: (visible: boolean) => void;
}>({
  setVisible: () => {},
});

// Custom Tab Bar Component
const CustomTabBar = React.memo(({ state, descriptors, navigation }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();
  const activeTab = useSharedValue(state.index);

  const handleTabPress = (index: number, routeName: string) => {
    'worklet';
    if (state.index !== index) {
      activeTab.value = withSpring(index);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate(routeName);
  };

  const tabs = useMemo(() => [
    { 
      key: 'index', 
      icon: Home, 
      label: 'Accueil',
      color: '#1E3A8A'
    },
    { 
      key: 'children', 
      icon: Users, 
      label: 'Enfants',
      color: '#10B981'
    },
    { 
      key: 'qr', 
      icon: QrCode, 
      label: 'QR',
      color: '#F59E0B',
      isCentral: true
    },
    { 
      key: 'history', 
      icon: Clock, 
      label: 'Historique',
      color: '#6366F1',
      hasBadge: true
    },
    { 
      key: 'profile', 
      icon: User, 
      label: 'Profil',
      color: '#8B5CF6'
    },
  ], []);

  return (
    <BlurView 
      intensity={80} 
      tint="light" 
      className="absolute bottom-0 left-0 right-0 border-t border-gray-200"
      style={{ paddingBottom: insets.bottom }}
    >
      <View className="flex-row justify-around items-center py-2 bg-white/80 backdrop-blur-xl">
        {tabs.map((tab, index) => {
          const isFocused = state.index === index;
          const Icon = tab.icon;
          
          const animatedStyle = useAnimatedStyle(() => ({
            transform: [
              {
                scale: withSpring(isFocused ? 1.1 : 1, {
                  damping: 15,
                  stiffness: 300,
                }),
              },
            ],
            color: interpolateColor(
              activeTab.value,
              tabs.map((_, i) => i),
              tabs.map(t => t.color),
            ),
          }));

          const tabStyle = tab.isCentral 
            ? 'items-center justify-center' 
            : 'items-center justify-center flex-1';

          return (
            <Pressable
              key={tab.key}
              className={tabStyle}
              style={{ minHeight: 56 }}
              onPress={() => handleTabPress(index, tab.key)}
              accessibilityRole="button"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: isFocused }}
            >
              <View className="relative">
                <Animated.View
                  style={[
                    animatedStyle,
                    tab.isCentral && {
                      shadowColor: tab.color,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 8,
                    }
                  ]}
                  className={`items-center justify-center ${
                    tab.isCentral ? 'w-14 h-14 bg-primary rounded-2xl' : 'w-10 h-10'
                  }`}
                >
                  <Icon 
                    size={tab.isCentral ? 28 : 20} 
                    color={isFocused ? 'white' : '#64748B'} 
                    strokeWidth={2}
                  />
                </Animated.View>
                
                {tab.hasBadge && (
                  <View className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                )}
              </View>
              
              {!tab.isCentral && (
                <Animated.Text 
                  className={`text-xs mt-1 ${
                    isFocused ? 'text-primary font-semibold' : 'text-gray-500'
                  }`}
                  style={[
                    animatedStyle,
                    { fontSize: 11 }
                  ]}
                >
                  {tab.label}
                </Animated.Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </BlurView>
  );
});

CustomTabBar.displayName = 'CustomTabBar';

export default function ParentTabsLayout() {
  return (
    <TabBarVisibilityContext.Provider value={{ setVisible: () => {} }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBar: (props) => <CustomTabBar {...props} />,
          tabBarStyle: { display: 'none' }, // Hide default tab bar
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Accueil',
            href: '/(parent-tabs)/',
          }}
        />
        <Tabs.Screen
          name="children"
          options={{
            title: 'Enfants',
            href: '/(parent-tabs)/children',
          }}
        />
        <Tabs.Screen
          name="qr"
          options={{
            title: 'QR',
            href: '/(parent-tabs)/qr',
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'Historique',
            href: '/(parent-tabs)/history',
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profil',
            href: '/(parent-tabs)/profile',
          }}
        />
      </Tabs>
    </TabBarVisibilityContext.Provider>
  );
}
