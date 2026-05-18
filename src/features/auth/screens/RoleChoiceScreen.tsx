import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  CheckCircle2,
  GraduationCap,
  Shield,
  Users,
} from 'lucide-react-native';
import React, { memo, useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '@/lib/supabase/client';
import { mapSupabaseSessionToAuthSession, setDevRoleOverride, clearDevRoleOverride } from '../utils/mapAuthSession';
import { useAuthStore } from '../store/auth.store';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthPrimaryButton } from '../components/ui';
import { useTheme } from '@/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.36;

interface RoleItem {
  id: 'parent' | 'school' | 'collector';
  title: string;
  description: string;
  Icon: React.ComponentType<{
    size: number;
    color: string;
    strokeWidth: number;
  }>;
  route: string;
}

const ROLES: RoleItem[] = [
  {
    id: 'parent',
    title: 'Parent',
    description: 'Suivi et sécurité des enfants',
    Icon: Users,
    route: '/(auth)/parent',
  },
  {
    id: 'collector',
    title: 'Collecteur',
    description: 'Validation des autorisations',
    Icon: Shield,
    route: '/(auth)/collector-pin',
  },
  {
    id: 'school',
    title: 'Établissement',
    description: 'Gestion globale de la sécurité',
    Icon: GraduationCap,
    route: '/(auth)/school',
  },
];

interface RoleCardProps {
  item: RoleItem;
  selected: boolean;
  onPress: (item: RoleItem) => void;
  index: number;
}

const RoleCard: React.FC<RoleCardProps> = memo(
  ({ item, selected, onPress, index }) => {
    const t = useTheme();
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const handlePressIn = useCallback(() => {
      scale.value = withSpring(0.98, { damping: 20, stiffness: 400 });
    }, [scale]);

    const handlePressOut = useCallback(() => {
      scale.value = withSpring(1, { damping: 20, stiffness: 400 });
    }, [scale]);

    const { Icon } = item;

    const cardBorder = selected ? t.primary : t.cardBorder;
    const iconBg = selected ? t.primaryBg : t.iconBg;

    return (
      <Animated.View
        entering={FadeInDown.delay(150 + index * 80).duration(400)}
        style={[animatedStyle, { marginBottom: 12 }]}
      >
        <Pressable
          onPress={() => onPress(item)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 16,
              borderRadius: 24,
              backgroundColor: t.card,
              borderWidth: 2,
              borderColor: cardBorder,
              shadowColor: selected ? t.primary : '#000',
              shadowOffset: { width: 0, height: selected ? 4 : 1 },
              shadowOpacity: selected
                ? t.isDark
                  ? 0.3
                  : 0.12
                : t.isDark
                  ? 0
                  : 0.04,
              shadowRadius: selected ? 12 : 3,
              elevation: selected ? 6 : 1,
            }}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 18,
                backgroundColor: iconBg,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 14,
              }}
            >
              <Icon size={24} color={t.primary} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: t.text,
                  marginBottom: 2,
                }}
              >
                {item.title}
              </Text>
              <Text style={{ fontSize: 13, color: t.textSecondary }}>
                {item.description}
              </Text>
            </View>
            {selected && (
              <Animated.View entering={FadeInUp.duration(200)}>
                <CheckCircle2 size={22} color={t.primary} strokeWidth={2} />
              </Animated.View>
            )}
          </View>
        </Pressable>
      </Animated.View>
    );
  }
);

RoleCard.displayName = 'RoleCard';

const DEV_ROLES = ['collector', 'parent', 'school_admin'] as const;
type DevRole = typeof DEV_ROLES[number];

function DevLogin() {
  const t = useTheme();
  const loginAction = useAuthStore(s => s.login);
  const [email, setEmail] = useState('shavod.tech@gmail.com');
  const [password, setPassword] = useState('TestCollector123!');
  const [forceRole, setForceRole] = useState<DevRole>('collector');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [detectedRole, setDetectedRole] = useState<string | null>(null);

  const handleLogin = useCallback(async () => {
    if (!email || !password) {
      setErr('Email et mot de passe requis.');
      return;
    }
    setLoading(true);
    setErr(null);
    setDetectedRole(null);
    try {
      await setDevRoleOverride(forceRole);
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error || !data.session) throw new Error(error?.message ?? 'Erreur');
      const session = await mapSupabaseSessionToAuthSession(data.session);
      setDetectedRole(session.user.role);
      loginAction(session);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [email, password, forceRole, loginAction]);

  const handleClearOverride = useCallback(async () => {
    await clearDevRoleOverride();
    setDetectedRole(null);
    setErr('Override effacé — redémarre l\'app');
  }, []);

  return (
    <View
      style={{
        marginTop: 32,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: t.amber,
        borderStyle: 'dashed',
        gap: 10,
      }}
    >
      <Text style={{ fontSize: 11, fontWeight: '700', color: t.amber, letterSpacing: 1, textTransform: 'uppercase' }}>
        ⚙️ Dev — connexion directe
      </Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="email@test.com"
        placeholderTextColor={t.placeholder}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{
          backgroundColor: t.input,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: t.inputBorder,
          paddingHorizontal: 12,
          paddingVertical: 10,
          fontSize: 14,
          color: t.text,
        }}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="mot de passe"
        placeholderTextColor={t.placeholder}
        secureTextEntry
        style={{
          backgroundColor: t.input,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: t.inputBorder,
          paddingHorizontal: 12,
          paddingVertical: 10,
          fontSize: 14,
          color: t.text,
        }}
      />

      {/* Role selector */}
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {DEV_ROLES.map(r => (
          <TouchableOpacity
            key={r}
            onPress={() => setForceRole(r)}
            style={{
              flex: 1,
              paddingVertical: 6,
              borderRadius: 8,
              alignItems: 'center',
              backgroundColor: forceRole === r ? t.amber : t.input,
              borderWidth: 1,
              borderColor: forceRole === r ? t.amber : t.inputBorder,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '700', color: forceRole === r ? '#fff' : t.textMuted }}>
              {r === 'school_admin' ? 'école' : r}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {detectedRole && (
        <Text style={{ fontSize: 11, color: t.textSecondary }}>
          Rôle Supabase : <Text style={{ color: t.amber, fontWeight: '700' }}>{detectedRole}</Text>
          {detectedRole !== forceRole ? ` → forcé : ${forceRole}` : ''}
        </Text>
      )}
      {err && <Text style={{ fontSize: 12, color: t.red }}>{err}</Text>}

      <TouchableOpacity
        onPress={handleLogin}
        disabled={loading}
        style={{
          backgroundColor: t.amber,
          borderRadius: 10,
          paddingVertical: 10,
          alignItems: 'center',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
            Se connecter en tant que {forceRole === 'school_admin' ? 'école' : forceRole}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleClearOverride}
        style={{ alignItems: 'center', paddingVertical: 6 }}
      >
        <Text style={{ fontSize: 11, color: t.textMuted }}>
          Effacer l'override de rôle
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export const RoleChoiceScreen: React.FC = memo(() => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const t = useTheme();
  const [selectedId, setSelectedId] = useState<RoleItem['id'] | null>(null);

  const selectedRoute = useMemo(
    () => ROLES.find(r => r.id === selectedId)?.route,
    [selectedId]
  );

  const handleRolePress = useCallback((item: RoleItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedId(item.id);
  }, []);

  const handleContinue = useCallback(() => {
    if (!selectedRoute) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(selectedRoute as any);
  }, [selectedRoute, router]);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ height: HERO_HEIGHT }}>
        <Image
          source={require('../../../../assets/images/icon.png')}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
          }}
          resizeMode="cover"
        />
        <LinearGradient
          colors={[
            t.isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)',
            t.isDark ? 'rgba(13,17,23,0.6)' : 'rgba(249,245,240,0.5)',
            t.bg,
          ]}
          locations={[0, 0.65, 1]}
          style={{ position: 'absolute', inset: 0 }}
        />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
          <Animated.View
            entering={FadeInDown.delay(80).duration(500)}
            style={{ marginBottom: 28 }}
          >
            <Text
              style={{
                fontSize: 28,
                fontWeight: '800',
                letterSpacing: -0.5,
                color: t.text,
                marginBottom: 6,
              }}
            >
              Choisissez votre rôle
            </Text>
            <Text style={{ fontSize: 15, color: t.textSecondary }}>
              Pour une expérience personnalisée
            </Text>
          </Animated.View>

          {ROLES.map((role, index) => (
            <RoleCard
              key={role.id}
              item={role}
              selected={selectedId === role.id}
              onPress={handleRolePress}
              index={index}
            />
          ))}

          {__DEV__ && <DevLogin />}
        </View>
      </ScrollView>

      <Animated.View
        entering={FadeInUp.delay(400).duration(500)}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingBottom: insets.bottom + 16,
          paddingHorizontal: 24,
          paddingTop: 16,
          backgroundColor: t.ctaBg,
          borderTopWidth: 1,
          borderTopColor: t.ctaBorder,
        }}
      >
        <AuthPrimaryButton
          onPress={handleContinue}
          disabled={!selectedId}
          variant="primary"
        >
          Continuer
        </AuthPrimaryButton>
        <Text
          style={{
            textAlign: 'center',
            color: t.textMuted,
            fontSize: 10,
            letterSpacing: 2,
            marginTop: 10,
          }}
        >
          SECURI'CLICK • PLATEFORME SÉCURISÉE
        </Text>
      </Animated.View>
    </View>
  );
});

RoleChoiceScreen.displayName = 'RoleChoiceScreen';
