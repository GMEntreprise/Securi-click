import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  useColorScheme,
} from 'react-native';
import { router } from 'expo-router';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { UserPlus, Shield, Clock, ChevronRight } from 'lucide-react-native';

const mockChildren = [
  {
    id: '1',
    firstName: 'Emma',
    lastName: 'Dupont',
    age: 8,
    school: 'École Primaire Saint-Exupéry',
    grade: 'CE2',
    activeAuthorizations: 2,
    todayPickups: 1,
  },
  {
    id: '2',
    firstName: 'Lucas',
    lastName: 'Dupont',
    age: 6,
    school: 'École Maternelle Les Petits Loups',
    grade: 'CP',
    activeAuthorizations: 1,
    todayPickups: 0,
  },
];

function useTheme() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  return {
    dark,
    bg: dark ? '#0d1117' : '#f9f5f0',
    card: dark ? '#161b22' : '#ffffff',
    cardBorder: dark ? '#21262d' : '#f0ede8',
    header: dark ? '#111111' : '#ffffff',
    headerBorder: dark ? '#21262d' : '#f0ede8',
    text: dark ? '#f9fafb' : '#111827',
    textSecondary: dark ? '#9ca3af' : '#6b7280',
    textMuted: dark ? '#6b7280' : '#9ca3af',
    accent: dark ? '#3b82f6' : '#f97316',
    separator: dark ? '#21262d' : '#f0ede8',
  };
}

function Avatar({ initials, dark }: { initials: string; dark: boolean }) {
  return (
    <View
      style={{
        width: 56,
        height: 56,
        borderRadius: 18,
        backgroundColor: dark ? 'rgba(30,58,138,0.3)' : 'rgba(30,58,138,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#1e3a8a', fontSize: 18, fontWeight: '800' }}>
        {initials}
      </Text>
    </View>
  );
}

function ChildCard({
  item,
  index,
  onPress,
}: {
  item: (typeof mockChildren)[0];
  index: number;
  onPress: (c: (typeof mockChildren)[0]) => void;
}) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const initials = `${item.firstName[0]}${item.lastName[0]}`;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).duration(400)}
      style={{ marginBottom: 12 }}
    >
      <TouchableOpacity
        onPress={() => {
          scale.value = withSpring(0.97, { damping: 12, stiffness: 300 });
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setTimeout(() => {
            scale.value = withSpring(1);
            onPress(item);
          }, 100);
        }}
        activeOpacity={1}
      >
        <Animated.View
          style={[
            animStyle,
            {
              backgroundColor: theme.card,
              borderRadius: 22,
              borderWidth: 1,
              borderColor: theme.cardBorder,
              padding: 16,
              overflow: 'hidden',
            },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Avatar initials={initials} dark={theme.dark} />
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text
                style={{ color: theme.text, fontSize: 17, fontWeight: '700' }}
              >
                {item.firstName} {item.lastName}
              </Text>
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: 13,
                  marginTop: 2,
                }}
              >
                {item.age} ans · {item.grade}
              </Text>
              <Text
                style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}
                numberOfLines={1}
              >
                {item.school}
              </Text>
            </View>
            <ChevronRight size={18} color={theme.textMuted} />
          </View>

          <View
            style={{
              flexDirection: 'row',
              marginTop: 14,
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: theme.separator,
              gap: 12,
            }}
          >
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 9,
                  backgroundColor: 'rgba(30,58,138,0.1)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Shield size={14} color="#1e3a8a" />
              </View>
              <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                {item.activeAuthorizations} autorisation
                {item.activeAuthorizations > 1 ? 's' : ''}
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 9,
                  backgroundColor: 'rgba(16,185,129,0.1)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Clock size={14} color="#10b981" />
              </View>
              <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                {item.todayPickups} aujourd'hui
              </Text>
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ChildrenList() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const handleChildPress = useCallback((child: (typeof mockChildren)[0]) => {
    router.push(`/(parent-tabs)/children/${child.id}` as any);
  }, []);

  const handleAddChild = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(parent-tabs)/children/add' as any);
  }, []);

  const renderChild = useCallback(
    ({ item, index }: { item: (typeof mockChildren)[0]; index: number }) => (
      <ChildCard item={item} index={index} onPress={handleChildPress} />
    ),
    [handleChildPress]
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <Animated.View
        entering={FadeInDown.duration(400)}
        style={{
          backgroundColor: theme.header,
          borderBottomWidth: 1,
          borderBottomColor: theme.headerBorder,
          paddingTop: insets.top + 16,
          paddingBottom: 16,
          paddingHorizontal: 20,
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
        }}
      >
        <View>
          <Text
            style={{
              color: theme.textMuted,
              fontSize: 11,
              fontWeight: '700',
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
            Mes enfants
          </Text>
          <Text
            style={{
              color: theme.text,
              fontSize: 26,
              fontWeight: '800',
              letterSpacing: -0.5,
            }}
          >
            {mockChildren.length} enfant{mockChildren.length > 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleAddChild}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: theme.accent,
            borderRadius: 14,
            paddingVertical: 10,
            paddingHorizontal: 14,
          }}
        >
          <UserPlus size={16} color="#fff" strokeWidth={2.5} />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>
            Ajouter
          </Text>
        </TouchableOpacity>
      </Animated.View>

      <FlatList
        data={mockChildren}
        renderItem={renderChild}
        keyExtractor={item => item.id}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
