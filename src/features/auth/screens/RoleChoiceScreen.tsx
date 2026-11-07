import { useAppNavigation } from '@/navigation/useAppNavigation';
import { useTheme } from '@/theme';
import { ParentIcon } from '@/shared/ui/icons/ParentIcon';
import { CollectorIcon } from '@/shared/ui/icons/CollectorIcon';
import { SchoolIcon } from '@/shared/ui/icons/SchoolIcon';
import { DemoIcon } from '@/shared/ui/icons/DemoIcon';
import { ROLE_ICON_SIZE, type RoleIconName } from '@/constants/roleIcons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguageStore } from '@/stores/language.store';
import {
  useComplianceStore,
  useHasSeenWelcome,
} from '@/stores/compliance.store';
import { WelcomeComplianceSheet } from '../components/ui/WelcomeComplianceSheet';
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthPrimaryButton } from '../components/ui';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.36;

interface RoleItem {
  id: 'parent' | 'school' | 'collector';
  title: string;
  description: string;
  icon: RoleIconName;
  route: string;
}

function buildRoles(t: (key: string) => string): RoleItem[] {
  return [
    {
      id: 'parent',
      title: t('role_parent_title'),
      description: t('role_parent_desc'),
      icon: 'parent',
      route: '/(auth)/parent',
    },
    {
      id: 'collector',
      title: t('role_collector_title'),
      description: t('role_collector_desc'),
      icon: 'collector',
      route: '/(auth)/collector-pin',
    },
    {
      id: 'school',
      title: t('role_school_title'),
      description: t('role_school_desc'),
      icon: 'school',
      route: '/(auth)/school',
    },
  ];
}

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

    const cardBorder = selected ? t.primary : t.cardBorder;
    const Icon =
      item.id === 'parent'
        ? ParentIcon
        : item.id === 'collector'
          ? CollectorIcon
          : SchoolIcon;

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
            <View style={{ marginRight: 14 }}>
              <Icon size={ROLE_ICON_SIZE} />
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
                <MaterialCommunityIcons
                  name="check-circle"
                  size={22}
                  color={t.primary}
                />
              </Animated.View>
            )}
          </View>
        </Pressable>
      </Animated.View>
    );
  }
);

RoleCard.displayName = 'RoleCard';

export const RoleChoiceScreen: React.FC = memo(() => {
  const nav = useAppNavigation();
  const insets = useSafeAreaInsets();
  const t = useTheme();
  const { t: i18n } = useTranslation('auth');
  const { t: i18nCommon } = useTranslation('common');
  const { t: i18nDemo } = useTranslation('demo');
  const language = useLanguageStore(s => s.language);
  const [selectedId, setSelectedId] = useState<RoleItem['id'] | null>(null);
  const [showCompliance, setShowCompliance] = useState(false);
  const [footerHeight, setFooterHeight] = useState(0);

  const hasSeenWelcome = useHasSeenWelcome();
  const acceptWelcome = useComplianceStore(s => s.acceptWelcome);

  const roles = useMemo(() => buildRoles(i18n), [language, i18n]);

  const selectedRoute = useMemo(
    () => roles.find(r => r.id === selectedId)?.route,
    [roles, selectedId]
  );

  const handleRolePress = useCallback((item: RoleItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedId(item.id);
  }, []);

  const handleContinue = useCallback(() => {
    if (!selectedRoute) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!hasSeenWelcome) {
      setShowCompliance(true);
    } else {
      nav.pushRoute(selectedRoute);
    }
  }, [selectedRoute, nav, hasSeenWelcome]);

  const handleComplianceContinue = useCallback(async () => {
    await acceptWelcome();
    setShowCompliance(false);
    if (selectedRoute) nav.pushRoute(selectedRoute);
  }, [acceptWelcome, selectedRoute, nav]);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <WelcomeComplianceSheet
        visible={showCompliance}
        onContinue={handleComplianceContinue}
        onOpenPrivacy={() => nav.goToParentPrivacyPolicy()}
        onOpenLegal={() => nav.goToParentLegalMentions()}
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: footerHeight + 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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
              {i18n('role_title')}
            </Text>
            <Text style={{ fontSize: 15, color: t.textSecondary }}>
              {i18n('role_subtitle')}
            </Text>
          </Animated.View>

          <Pressable
            cssInterop={false}
            onPress={() => nav.pushRoute('/demo')}
            accessibilityRole="button"
            accessibilityLabel={i18nDemo('entry_title')}
            accessibilityHint={i18nDemo('entry_subtitle')}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
              padding: 18,
              marginBottom: 16,
              borderRadius: 22,
              backgroundColor: t.card,
              borderWidth: 1.5,
              borderColor: pressed ? t.accent : t.cardBorder,
              transform: [{ scale: pressed ? 0.985 : 1 }],
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: t.isDark ? 0 : 0.05,
              shadowRadius: 8,
              elevation: 1,
            })}
          >
            <DemoIcon size={ROLE_ICON_SIZE} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ fontSize: 17, fontWeight: '800', color: t.text }}>
                {i18nDemo('entry_title')}
              </Text>
              <Text
                style={{ fontSize: 14, lineHeight: 20, color: t.textSecondary }}
              >
                {i18nDemo('entry_subtitle')}
              </Text>
            </View>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: t.iconBg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialCommunityIcons
                name="chevron-right"
                size={18}
                color={t.text}
              />
            </View>
          </Pressable>

          {roles.map((role, index) => (
            <RoleCard
              key={role.id}
              item={role}
              selected={selectedId === role.id}
              onPress={handleRolePress}
              index={index}
            />
          ))}
        </View>
      </ScrollView>

      <Animated.View
        entering={FadeInUp.delay(400).duration(500)}
        onLayout={event => setFooterHeight(event.nativeEvent.layout.height)}
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
          {i18nCommon('continue')}
        </AuthPrimaryButton>
        <View style={{ alignItems: 'center', marginTop: 14, gap: 2 }}>
          <Text
            style={{
              color: t.primary,
              fontSize: 13,
              fontWeight: '700',
              letterSpacing: 0.3,
            }}
          >
            {i18nCommon('rights_reserved')}
          </Text>
          <Text
            style={{
              color: t.textMuted,
              fontSize: 11,
              letterSpacing: 0.2,
            }}
          >
            {i18nCommon('all_rights')}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
});

RoleChoiceScreen.displayName = 'RoleChoiceScreen';
