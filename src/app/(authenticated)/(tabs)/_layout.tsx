/**
 * Tabs + CurvedBottomTabs (barre custom). Routes : /home, /search, /profile.
 *
 * @see https://docs.expo.dev/router/advanced/tabs/
 */
import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { CurvedBottomTabs } from '@/shared/ui/base/curved-bottom-tabs';

const BRAND_GRADIENT = ['#208AEF', '#1259A8'];

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={props => (
        <CurvedBottomTabs {...props} gradients={BRAND_GRADIENT} />
      )}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Recherche',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
