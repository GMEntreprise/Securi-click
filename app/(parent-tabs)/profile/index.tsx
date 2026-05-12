import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
  LayoutAnimationConfig,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  User,
  Bell,
  Shield,
  Smartphone,
  Moon,
  Sun,
  LogOut,
  ChevronRight,
  Settings,
  HelpCircle,
  FileText,
  Lock,
} from 'lucide-react-native';

// Mock data - will be replaced with real hooks
const mockProfile = {
  name: 'Parent User',
  email: 'parent@securiclick.fr',
  phone: '06 12 34 56 78',
  avatar: '👨‍👩‍👧‍👦',
  notifications: true,
  biometricAuth: true,
  darkMode: false,
  twoFactorAuth: true,
};

interface SettingItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  value?: boolean;
  onPress: () => void;
  showToggle?: boolean;
  onToggle?: (value: boolean) => void;
}

const SettingItem = React.memo(({ 
  icon, 
  title, 
  subtitle, 
  value, 
  onPress, 
  showToggle, 
  onToggle 
}: SettingItemProps) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: withSpring(scale.value, {
          damping: 15,
          stiffness: 300,
        }),
      },
    ],
  }));

  const handlePress = useCallback(() => {
    scale.value = 0.95;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => {
      scale.value = 1;
      onPress();
    }, 100);
  }, [onPress]);

  const handleToggle = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle?.(!value!);
  }, [value, onToggle]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="bg-white rounded-xl p-4 mb-3 border border-gray-100"
      style={animatedStyle}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center space-x-3 flex-1">
          <View className="w-10 h-10 bg-primary rounded-lg items-center justify-center">
            {icon}
          </View>
          
          <View className="flex-1">
            <Text className="font-semibold text-foreground mb-1">
              {title}
            </Text>
            {subtitle && (
              <Text className="text-sm text-gray-500">
                {subtitle}
              </Text>
            )}
          </View>
        </View>
        
        <View className="flex-row items-center space-x-2">
          {showToggle && (
            <Switch
              value={value}
              onValueChange={handleToggle}
              trackColor={{ false: '#E5E7EB', true: '#10B981' }}
              thumbColor={value ? '#FFFFFF' : '#FFFFFF'}
              ios_backgroundColor={value ? '#10B981' : '#E5E7EB'}
            />
          )}
          
          <ChevronRight size={20} color="#64748B" />
        </View>
      </View>
    </TouchableOpacity>
  );
});

SettingItem.displayName = 'SettingItem';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = React.useState(mockProfile);

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: withSpring(scale.value, {
          damping: 15,
          stiffness: 300,
        }),
      },
    ],
  }));

  const handleLogout = useCallback(() => {
    scale.value = 0.95;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    setTimeout(() => {
      scale.value = 1;
      Alert.alert(
        'Déconnexion',
        'Êtes-vous sûr de vouloir vous déconnecter ?',
        [
          {
            text: 'Annuler',
            style: 'cancel',
            onPress: () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            },
          },
          {
            text: 'Se déconnecter',
            style: 'destructive',
            onPress: () => {
              // TODO: Implement logout logic
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.replace('/(auth)/login');
            },
          },
        ]
      );
    }, 100);
  }, [router]);

  const handleSettingToggle = useCallback((setting: string, value: boolean) => {
    setProfile(prev => ({ ...prev, [setting]: value }));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const sections = useMemo(() => [
    {
      title: 'Compte',
      items: [
        {
          icon: <User size={18} color="white" />,
          title: 'Informations personnelles',
          subtitle: 'Nom, email, téléphone',
          onPress: () => {
            // TODO: Navigate to personal info
          },
        },
        {
          icon: <Shield size={18} color="white" />,
          title: 'Sécurité',
          subtitle: 'Mot de passe, authentification',
          onPress: () => {
            // TODO: Navigate to security settings
          },
        },
      ],
    },
    {
      title: 'Préférences',
      items: [
        {
          icon: <Bell size={18} color="white" />,
          title: 'Notifications',
          subtitle: 'Alertes push, emails',
          showToggle: true,
          value: profile.notifications,
          onToggle: (value) => handleSettingToggle('notifications', value),
          onPress: () => {},
        },
        {
          icon: <Smartphone size={18} color="white" />,
          title: 'Authentification biométrique',
          subtitle: 'Face ID, empreinte',
          showToggle: true,
          value: profile.biometricAuth,
          onToggle: (value) => handleSettingToggle('biometricAuth', value),
          onPress: () => {},
        },
        {
          icon: profile.darkMode ? <Moon size={18} color="white" /> : <Sun size={18} color="white" />,
          title: 'Mode sombre',
          subtitle: 'Thème de l\'application',
          showToggle: true,
          value: profile.darkMode,
          onToggle: (value) => handleSettingToggle('darkMode', value),
          onPress: () => {},
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: <HelpCircle size={18} color="white" />,
          title: 'Aide & FAQ',
          subtitle: 'Questions fréquentes',
          onPress: () => {
            // TODO: Open help
          },
        },
        {
          icon: <FileText size={18} color="white" />,
          title: 'Conditions d\'utilisation',
          subtitle: 'Mentions légales',
          onPress: () => {
            // TODO: Open terms
          },
        },
        {
          icon: <Lock size={18} color="white" />,
          title: 'Politique de confidentialité',
          subtitle: 'Vos données sont protégées',
          onPress: () => {
            // TODO: Open privacy policy
          },
        },
      ],
    },
  ], [profile.darkMode]);

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4 pt-4" style={{ paddingBottom: insets.bottom + 80 }}>
          {/* Profile Header */}
          <Animated.View 
            entering={FadeInDown.duration(600)}
            className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100"
          >
            <View className="flex-row items-center space-x-4 mb-4">
              <View className="w-20 h-20 bg-primary rounded-2xl items-center justify-center">
                <Text className="text-3xl">{profile.avatar}</Text>
              </View>
              
              <View className="flex-1">
                <Text className="text-xl font-bold text-foreground mb-1">
                  {profile.name}
                </Text>
                <Text className="text-sm text-gray-500 mb-1">
                  {profile.email}
                </Text>
                <Text className="text-sm text-gray-500">
                  {profile.phone}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity
              className="bg-gray-100 rounded-lg px-4 py-2"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                // TODO: Edit profile
              }}
            >
              <Text className="text-gray-700 font-medium">
                Modifier
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Settings Sections */}
          {sections.map((section, sectionIndex) => (
            <Animated.View
              key={section.title}
              entering={FadeInDown.delay(sectionIndex * 100).duration(600)}
              className="mb-6"
            >
              <Text className="text-lg font-semibold text-foreground mb-3">
                {section.title}
              </Text>
              
              <View className="bg-white rounded-2xl border border-gray-100">
                {section.items.map((item, itemIndex) => (
                  <SettingItem
                    key={item.title}
                    {...item}
                  />
                ))}
              </View>
            </Animated.View>
          ))}

          {/* Logout Button */}
          <Animated.View 
            entering={FadeInDown.delay(300).duration(600)}
            className="mb-6"
          >
            <TouchableOpacity
              onPress={handleLogout}
              className="bg-red-50 border border-red-200 rounded-2xl p-4 flex-row items-center justify-center"
              style={animatedStyle}
            >
              <LogOut size={20} color="#EF4444" />
              <Text className="text-red-600 font-semibold text-lg ml-2">
                Se déconnecter
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}
