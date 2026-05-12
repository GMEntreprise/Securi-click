import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { router } from 'expo-router';
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
  UserPlus, 
  Shield, 
  Clock, 
  ChevronRight,
  User,
} from 'lucide-react-native';

// Mock data - will be replaced with real hooks
const mockChildren = [
  {
    id: '1',
    name: 'Emma',
    age: 8,
    school: 'École Primaire Saint-Exupéry',
    grade: 'CE2',
    avatar: '👧',
    activeAuthorizations: 2,
    todayPickups: 1,
    status: 'active',
  },
  {
    id: '2',
    name: 'Lucas',
    age: 6,
    school: 'École Maternelle Les Petits Loups',
    grade: 'CP',
    avatar: '👦',
    activeAuthorizations: 1,
    todayPickups: 0,
    status: 'active',
  },
];

interface ChildCardProps {
  item: any;
  index: number;
  onPress: (child: any) => void;
}

const ChildCard = React.memo(({ item, index, onPress }: ChildCardProps) => {
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
      onPress(item);
    }, 100);
  }, [item, onPress]);

  const getStatusColor = () => {
    switch (item.status) {
      case 'active':
        return 'bg-green-50 border-green-200';
      case 'inactive':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getStatusBadgeColor = () => {
    switch (item.status) {
      case 'active':
        return 'bg-green-500';
      case 'inactive':
        return 'bg-gray-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(400)}
      className="mb-4"
    >
      <TouchableOpacity
        onPress={handlePress}
        className={`bg-white rounded-2xl p-4 border ${getStatusColor()} shadow-sm`}
        style={animatedStyle}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center space-x-4 flex-1">
            <View className="w-16 h-16 bg-primary rounded-2xl items-center justify-center">
              <Text className="text-3xl">{item.avatar}</Text>
            </View>
            
            <View className="flex-1">
              <View className="flex-row items-center space-x-2 mb-1">
                <Text className="text-lg font-bold text-foreground">
                  {item.name}
                </Text>
                <View className={`w-2 h-2 rounded-full ${getStatusBadgeColor()}`} />
              </View>
              
              <Text className="text-sm text-gray-500 mb-2">
                {item.age} ans • {item.grade}
              </Text>
              
              <Text className="text-xs text-gray-400" numberOfLines={1}>
                {item.school}
              </Text>
            </View>
          </View>
          
          <ChevronRight size={20} color="#64748B" />
        </View>
        
        <View className="flex-row space-x-4 mt-4 pt-3 border-t border-gray-100">
          <View className="flex-1 items-center">
            <Shield size={16} color="#1E3A8A" />
            <Text className="text-xs text-gray-500 mt-1">
              {item.activeAuthorizations} autorisations
            </Text>
          </View>
          
          <View className="flex-1 items-center">
            <Clock size={16} color="#10B981" />
            <Text className="text-xs text-gray-500 mt-1">
              {item.todayPickups} aujourd'hui
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

ChildCard.displayName = 'ChildCard';

export default function ChildrenList() {
  const insets = useSafeAreaInsets();

  const handleChildPress = useCallback((child: any) => {
    router.push(`/children/${child.id}`);
  }, []);

  const handleAddChild = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/children/add');
  }, []);

  const renderChild = useCallback(({ item, index }: any) => (
    <ChildCard 
      item={item} 
      index={index} 
      onPress={handleChildPress}
    />
  ), [handleChildPress]);

  const keyExtractor = useCallback((item: any) => item.id, []);

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <Animated.View 
        entering={FadeInDown.duration(600)}
        className="bg-white border-b border-gray-200 px-4 py-4"
      >
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-foreground mb-1">
              Mes Enfants
            </Text>
            <Text className="text-sm text-gray-500">
              {mockChildren.length} enfant{mockChildren.length > 1 ? 's' : ''}
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={handleAddChild}
            className="bg-primary rounded-xl px-4 py-2 flex-row items-center space-x-2"
          >
            <UserPlus size={18} color="white" />
            <Text className="text-white font-medium">Ajouter</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Children List */}
      <FlatList
        data={mockChildren}
        renderItem={renderChild}
        keyExtractor={keyExtractor}
        contentContainerStyle={{ 
          padding: 16,
          paddingBottom: 100, // Space for tab bar
        }}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 0 }} />}
      />
    </View>
  );
}
