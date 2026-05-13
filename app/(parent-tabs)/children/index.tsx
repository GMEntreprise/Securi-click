import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useTheme } from '@/theme';
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
import { useChildren } from '@/features/parent/hooks/useChildren';
import type { Child } from '@/features/parent/types';

function Avatar({ initials }: { initials: string }) {
  const t = useTheme();
  return (
    <View
      style={{
        width: 56,
        height: 56,
        borderRadius: 18,
        backgroundColor: t.primaryBg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: t.primary, fontSize: 18, fontWeight: '800' }}>
        {initials}
      </Text>
    </View>
  );
}

const ChildCard = React.memo(function ChildCard({
  item,
  index,
  onPress,
}: {
  item: Child;
  index: number;
  onPress: (c: Child) => void;
}) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const initials = `${item.first_name[0] ?? '?'}${item.last_name[0] ?? ''}`;

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
            <Avatar initials={initials} />
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text
                style={{ color: theme.text, fontSize: 17, fontWeight: '700' }}
              >
                {item.first_name} {item.last_name}
              </Text>
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: 13,
                  marginTop: 2,
                }}
              >
                {item.grade ?? '—'}
                {item.date_of_birth
                  ? ` · ${new Date().getFullYear() - new Date(item.date_of_birth).getFullYear()} ans`
                  : ''}
              </Text>
              {item.school_name ? (
                <Text
                  style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}
                  numberOfLines={1}
                >
                  {item.school_name}
                </Text>
              ) : null}
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
                  backgroundColor: theme.primaryBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Shield size={14} color={theme.primary} />
              </View>
              <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                Personnes autorisées
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
                  backgroundColor: theme.greenBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Clock size={14} color={theme.green} />
              </View>
              <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                Aujourd'hui
              </Text>
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
});

export default function ChildrenList() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { data: children, isLoading } = useChildren();

  const handleChildPress = useCallback((child: Child) => {
    router.push(`/(parent-tabs)/children/${child.id}` as any);
  }, []);

  const handleAddChild = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(parent-tabs)/children/add' as any);
  }, []);

  const renderChild = useCallback(
    ({ item, index }: { item: Child; index: number }) => (
      <ChildCard item={item} index={index} onPress={handleChildPress} />
    ),
    [handleChildPress]
  );

  const count = children?.length ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <Animated.View
        entering={FadeInDown.duration(400)}
        style={{
          backgroundColor: theme.card,
          borderBottomWidth: 1,
          borderBottomColor: theme.cardBorder,
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
            {isLoading ? '…' : `${count} enfant${count > 1 ? 's' : ''}`}
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

      {isLoading ? (
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <ActivityIndicator color={theme.accent} size="large" />
        </View>
      ) : count === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 40,
          }}
        >
          <Text
            style={{
              color: theme.textMuted,
              fontSize: 15,
              textAlign: 'center',
              lineHeight: 22,
            }}
          >
            Vous n'avez pas encore ajouté d'enfant.{'\n'}Commencez dès
            maintenant.
          </Text>
          <TouchableOpacity
            onPress={handleAddChild}
            style={{
              marginTop: 20,
              backgroundColor: theme.accent,
              borderRadius: 14,
              paddingVertical: 12,
              paddingHorizontal: 24,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
              Ajouter un enfant
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={children}
          renderItem={renderChild}
          keyExtractor={item => item.id}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + 100,
          }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
