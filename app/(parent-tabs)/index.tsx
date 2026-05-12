import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
  FadeIn,
  LayoutAnimationConfig,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  Shield,
  Users,
  QrCode,
  Clock,
  AlertCircle,
  CheckCircle,
  TrendingUp,
} from 'lucide-react-native';

// Mock data - will be replaced with real hooks
const mockStats = {
  activeAuthorizations: 3,
  todayPickups: 2,
  pendingRequests: 1,
  childrenCount: 2,
};

const mockRecentActivity = [
  {
    id: '1',
    type: 'pickup',
    childName: 'Emma',
    time: '14:30',
    status: 'completed',
    collector: 'Jean Dupont',
  },
  {
    id: '2',
    type: 'authorization',
    childName: 'Lucas',
    time: '09:15',
    status: 'pending',
    collector: 'Marie Martin',
  },
];

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  color: string;
  onPress: () => void;
}

const StatCard = React.memo(
  ({ icon, title, value, color, onPress }: StatCardProps) => {
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

    const handlePress = () => {
      scale.value = 0.95;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setTimeout(() => {
        scale.value = 1;
        onPress();
      }, 100);
    };

    return (
      <TouchableOpacity
        onPress={handlePress}
        className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
        style={animatedStyle}
      >
        <View className="flex-row items-center space-x-3">
          <View
            className={`w-12 h-12 rounded-xl items-center justify-center`}
            style={{ backgroundColor: `${color}15` }}
          >
            {icon}
          </View>
          <View className="flex-1">
            <Text className="text-gray-500 text-sm font-medium">{title}</Text>
            <Text className="text-foreground text-xl font-bold">{value}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }
);

StatCard.displayName = 'StatCard';

interface ActivityItemProps {
  item: any;
  index: number;
}

const ActivityItem = React.memo(({ item, index }: ActivityItemProps) => {
  const getStatusIcon = () => {
    switch (item.status) {
      case 'completed':
        return <CheckCircle size={16} color="#10B981" />;
      case 'pending':
        return <Clock size={16} color="#F59E0B" />;
      default:
        return <AlertCircle size={16} color="#64748B" />;
    }
  };

  const getStatusColor = () => {
    switch (item.status) {
      case 'completed':
        return 'text-green-500';
      case 'pending':
        return 'text-amber-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(400)}
      className="bg-white rounded-xl p-4 mb-3 border border-gray-100"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <View className="flex-row items-center space-x-2 mb-1">
            {getStatusIcon()}
            <Text className="font-semibold text-foreground">
              {item.childName}
            </Text>
          </View>
          <Text className="text-sm text-gray-500">
            {item.type === 'pickup' ? 'Récupération' : 'Autorisation'} •{' '}
            {item.time}
          </Text>
          {item.collector && (
            <Text className="text-xs text-gray-400 mt-1">
              Par {item.collector}
            </Text>
          )}
        </View>
        <View className={`text-xs font-medium ${getStatusColor()}`}>
          {item.status === 'completed' ? 'Terminé' : 'En attente'}
        </View>
      </View>
    </Animated.View>
  );
});

ActivityItem.displayName = 'ActivityItem';

export default function ParentDashboard() {
  const insets = useSafeAreaInsets();

  const handleQuickActions = useMemo(
    () => [
      {
        id: 'qr',
        icon: <QrCode size={24} color="white" />,
        label: 'Scanner QR',
        color: '#1E3A8A',
        onPress: () => router.push('/(parent-tabs)/qr'),
      },
      {
        id: 'add-child',
        icon: <Users size={24} color="white" />,
        label: 'Ajouter enfant',
        color: '#10B981',
        onPress: () => router.push('/(parent-tabs)/children/add'),
      },
      {
        id: 'history',
        icon: <Clock size={24} color="white" />,
        label: 'Historique',
        color: '#6366F1',
        onPress: () => router.push('/(parent-tabs)/history'),
      },
    ],
    []
  );

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <View
        className="flex-1 px-4 pt-4"
        style={{ paddingBottom: insets.bottom + 80 }}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(600)} className="mb-6">
          <Text className="text-3xl font-bold text-foreground mb-2">
            Bonjour Parent 👋
          </Text>
          <Text className="text-gray-500 text-base">
            Voici un aperçu de la sécurité de vos enfants
          </Text>
        </Animated.View>

        {/* Quick Stats */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(600)}
          className="mb-6"
        >
          <View className="flex-row justify-between space-x-3">
            <StatCard
              icon={<Shield size={20} color="#1E3A8A" />}
              title="Autorisations actives"
              value={mockStats.activeAuthorizations}
              color="#1E3A8A"
              onPress={() => router.push('/(parent-tabs)/children')}
            />
            <StatCard
              icon={<TrendingUp size={20} color="#10B981" />}
              title="Récupérations aujourd'hui"
              value={mockStats.todayPickups}
              color="#10B981"
              onPress={() => router.push('/(parent-tabs)/history')}
            />
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(600)}
          className="mb-6"
        >
          <Text className="text-lg font-semibold text-foreground mb-4">
            Actions rapides
          </Text>
          <View className="flex-row space-x-3">
            {handleQuickActions.map((action, index) => (
              <TouchableOpacity
                key={action.id}
                onPress={action.onPress}
                className="flex-1 h-24 rounded-2xl items-center justify-center shadow-sm"
                style={{ backgroundColor: action.color }}
              >
                <View className="items-center">
                  {action.icon}
                  <Text className="text-white text-sm font-medium mt-2">
                    {action.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Recent Activity */}
        <Animated.View entering={FadeInDown.delay(300).duration(600)}>
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold text-foreground">
              Activité récente
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(parent-tabs)/history')}
            >
              <Text className="text-primary text-sm font-medium">
                Voir tout
              </Text>
            </TouchableOpacity>
          </View>

          <View>
            {mockRecentActivity.slice(0, 3).map((item, index) => (
              <ActivityItem key={item.id} item={item} index={index} />
            ))}
          </View>
        </Animated.View>
      </View>
    </ScrollView>
  );
}
