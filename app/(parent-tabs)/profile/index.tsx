import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  User,
  Bell,
  Shield,
  Smartphone,
  LogOut,
  ChevronRight,
  HelpCircle,
  FileText,
  Lock,
} from 'lucide-react-native';

const mockProfile = {
  firstName: 'Parent',
  lastName: 'Utilisateur',
  email: 'parent@securiclick.fr',
  phone: '06 12 34 56 78',
  notifications: true,
  biometricAuth: true,
  darkMode: false,
};

function useTheme() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  return {
    dark,
    bg: dark ? '#0d1117' : '#f9f5f0',
    card: dark ? '#161b22' : '#ffffff',
    cardBorder: dark ? '#21262d' : '#f0ede8',
    text: dark ? '#f9fafb' : '#111827',
    textSecondary: dark ? '#9ca3af' : '#6b7280',
    textMuted: dark ? '#6b7280' : '#9ca3af',
    accent: dark ? '#3b82f6' : '#f97316',
    accentBg: dark ? 'rgba(59,130,246,0.12)' : 'rgba(249,115,22,0.1)',
    primary: '#1e3a8a',
    separator: dark ? '#21262d' : '#f3f4f6',
    rowBg: dark ? '#161b22' : '#ffffff',
    switchTrackOn: dark ? '#3b82f6' : '#f97316',
  };
}

interface RowItem {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle?: string;
  toggle?: boolean;
  value?: boolean;
  onToggle?: (v: boolean) => void;
  onPress: () => void;
  destructive?: boolean;
}

function SettingRow({ item, isLast }: { item: RowItem; isLast: boolean }) {
  const theme = useTheme();
  return (
    <TouchableOpacity
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        item.onPress();
      }}
      activeOpacity={item.toggle ? 1 : 0.7}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 13,
        paddingHorizontal: 16,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: theme.separator,
      }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 11,
          backgroundColor: item.destructive
            ? 'rgba(239,68,68,0.1)'
            : item.iconBg,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        {item.icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: item.destructive ? '#ef4444' : theme.text,
            fontSize: 15,
            fontWeight: '600',
          }}
        >
          {item.title}
        </Text>
        {item.subtitle && (
          <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 1 }}>
            {item.subtitle}
          </Text>
        )}
      </View>
      {item.toggle ? (
        <Switch
          value={item.value}
          onValueChange={v => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            item.onToggle?.(v);
          }}
          trackColor={{
            false: theme.dark ? '#30363d' : '#e5e7eb',
            true: theme.switchTrackOn,
          }}
          thumbColor="#ffffff"
          ios_backgroundColor={theme.dark ? '#30363d' : '#e5e7eb'}
        />
      ) : (
        <ChevronRight size={16} color={theme.textMuted} />
      )}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [prefs, setPrefs] = useState({
    notifications: mockProfile.notifications,
    biometricAuth: mockProfile.biometricAuth,
  });

  const toggle = useCallback((key: keyof typeof prefs, value: boolean) => {
    setPrefs(p => ({ ...p, [key]: value }));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const handleLogout = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnecter',
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.replace('/(auth)/login' as any);
        },
      },
    ]);
  }, [router]);

  const sections = useMemo(
    () => [
      {
        title: 'Compte',
        items: [
          {
            icon: <User size={16} color="#1e3a8a" strokeWidth={2.5} />,
            iconBg: 'rgba(30,58,138,0.1)',
            title: 'Informations personnelles',
            subtitle: 'Nom, email, téléphone',
            onPress: () => {},
          },
          {
            icon: <Shield size={16} color="#f97316" strokeWidth={2.5} />,
            iconBg: 'rgba(249,115,22,0.1)',
            title: 'Sécurité',
            subtitle: 'Mot de passe, 2FA',
            onPress: () => {},
          },
        ] as RowItem[],
      },
      {
        title: 'Préférences',
        items: [
          {
            icon: <Bell size={16} color="#10b981" strokeWidth={2.5} />,
            iconBg: 'rgba(16,185,129,0.1)',
            title: 'Notifications',
            subtitle: 'Alertes push et emails',
            toggle: true,
            value: prefs.notifications,
            onToggle: (v: boolean) => toggle('notifications', v),
            onPress: () => {},
          },
          {
            icon: <Smartphone size={16} color="#6366f1" strokeWidth={2.5} />,
            iconBg: 'rgba(99,102,241,0.1)',
            title: 'Authentification biométrique',
            subtitle: 'Face ID, empreinte',
            toggle: true,
            value: prefs.biometricAuth,
            onToggle: (v: boolean) => toggle('biometricAuth', v),
            onPress: () => {},
          },
        ] as RowItem[],
      },
      {
        title: 'Support',
        items: [
          {
            icon: <HelpCircle size={16} color="#f59e0b" strokeWidth={2.5} />,
            iconBg: 'rgba(245,158,11,0.1)',
            title: 'Aide & FAQ',
            onPress: () => {},
          },
          {
            icon: <FileText size={16} color="#6b7280" strokeWidth={2.5} />,
            iconBg: 'rgba(107,114,128,0.1)',
            title: "Conditions d'utilisation",
            onPress: () => {},
          },
          {
            icon: <Lock size={16} color="#6b7280" strokeWidth={2.5} />,
            iconBg: 'rgba(107,114,128,0.1)',
            title: 'Confidentialité',
            onPress: () => {},
          },
        ] as RowItem[],
      },
    ],
    [prefs, toggle]
  );

  const initials = `${mockProfile.firstName[0]}${mockProfile.lastName[0]}`;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingTop: insets.top + 20, paddingHorizontal: 20 }}>
          {/* Profile card */}
          <Animated.View
            entering={FadeInDown.duration(400)}
            style={{
              backgroundColor: theme.card,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: theme.cardBorder,
              padding: 20,
              marginBottom: 24,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 22,
                  backgroundColor: theme.accentBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                }}
              >
                <Text
                  style={{
                    color: theme.accent,
                    fontSize: 22,
                    fontWeight: '800',
                  }}
                >
                  {initials}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ color: theme.text, fontSize: 18, fontWeight: '800' }}
                >
                  {mockProfile.firstName} {mockProfile.lastName}
                </Text>
                <Text
                  style={{
                    color: theme.textSecondary,
                    fontSize: 13,
                    marginTop: 2,
                  }}
                >
                  {mockProfile.email}
                </Text>
                <Text
                  style={{ color: theme.textMuted, fontSize: 12, marginTop: 1 }}
                >
                  {mockProfile.phone}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() =>
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              }
              style={{
                backgroundColor: theme.dark ? '#21262d' : '#f3f4f6',
                borderRadius: 12,
                paddingVertical: 10,
                alignItems: 'center',
              }}
            >
              <Text
                style={{ color: theme.text, fontWeight: '600', fontSize: 14 }}
              >
                Modifier le profil
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Sections */}
          {sections.map((section, si) => (
            <Animated.View
              key={section.title}
              entering={FadeInDown.delay(si * 80).duration(400)}
              style={{ marginBottom: 20 }}
            >
              <Text
                style={{
                  color: theme.textMuted,
                  fontSize: 11,
                  fontWeight: '700',
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  marginBottom: 8,
                  marginLeft: 4,
                }}
              >
                {section.title}
              </Text>
              <View
                style={{
                  backgroundColor: theme.card,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: theme.cardBorder,
                  overflow: 'hidden',
                }}
              >
                {section.items.map((item, ii) => (
                  <SettingRow
                    key={item.title}
                    item={item}
                    isLast={ii === section.items.length - 1}
                  />
                ))}
              </View>
            </Animated.View>
          ))}

          {/* Logout */}
          <Animated.View
            entering={FadeInDown.delay(320).duration(400)}
            style={{ marginBottom: 8 }}
          >
            <TouchableOpacity
              onPress={handleLogout}
              style={{
                backgroundColor: theme.card,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: 'rgba(239,68,68,0.2)',
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <LogOut size={18} color="#ef4444" strokeWidth={2.5} />
              <Text
                style={{ color: '#ef4444', fontWeight: '700', fontSize: 15 }}
              >
                Se déconnecter
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}
