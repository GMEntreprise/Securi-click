import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
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
  Filter,
  Calendar,
  MapPin,
  User,
  CheckCircle,
  Clock,
  AlertCircle,
  Shield,
} from 'lucide-react-native';

// Mock data - will be replaced with real hooks
const mockHistory = [
  {
    id: '1',
    type: 'pickup',
    childName: 'Emma',
    collectorName: 'Jean Dupont',
    time: '14:30',
    date: '2024-01-15',
    location: 'École Primaire Saint-Exupéry',
    status: 'completed',
    qrCode: 'SC-EMMA-001',
  },
  {
    id: '2',
    type: 'authorization',
    childName: 'Lucas',
    collectorName: 'Marie Martin',
    time: '09:15',
    date: '2024-01-15',
    location: 'Portail principal',
    status: 'pending',
    qrCode: 'SC-LUCAS-002',
  },
  {
    id: '3',
    type: 'pickup',
    childName: 'Emma',
    collectorName: 'Jean Dupont',
    time: '16:45',
    date: '2024-01-14',
    location: 'École Primaire Saint-Exupéry',
    status: 'completed',
    qrCode: 'SC-EMMA-001',
  },
  {
    id: '4',
    type: 'failed_pickup',
    childName: 'Lucas',
    collectorName: 'Inconnu',
    time: '12:00',
    date: '2024-01-14',
    location: 'Portail secondaire',
    status: 'failed',
    qrCode: 'INVALID-QR',
  },
];

const filterOptions = [
  { id: 'all', label: 'Tout', icon: <Clock size={16} color="#64748B" /> },
  { id: 'pickup', label: 'Récupérations', icon: <CheckCircle size={16} color="#10B981" /> },
  { id: 'authorization', label: 'Autorisations', icon: <Shield size={16} color="#1E3A8A" /> },
  { id: 'failed', label: 'Échecs', icon: <AlertCircle size={16} color="#EF4444" /> },
];

interface HistoryItemProps {
  item: any;
  index: number;
}

const HistoryItem = React.memo(({ item, index }: HistoryItemProps) => {
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
      // TODO: Navigate to details
    }, 100);
  }, []);

  const getTypeIcon = () => {
    switch (item.type) {
      case 'pickup':
        return <CheckCircle size={20} color="#10B981" />;
      case 'authorization':
        return <Shield size={20} color="#1E3A8A" />;
      case 'failed_pickup':
        return <AlertCircle size={20} color="#EF4444" />;
      default:
        return <Clock size={20} color="#64748B" />;
    }
  };

  const getStatusColor = () => {
    switch (item.status) {
      case 'completed':
        return 'text-green-500 bg-green-50 border-green-200';
      case 'pending':
        return 'text-amber-500 bg-amber-50 border-amber-200';
      case 'failed':
        return 'text-red-500 bg-red-50 border-red-200';
      default:
        return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const getStatusBadge = () => {
    switch (item.status) {
      case 'completed':
        return 'Succès';
      case 'pending':
        return 'En attente';
      case 'failed':
        return 'Échec';
      default:
        return 'Inconnu';
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(400)}
      className="mb-3"
    >
      <TouchableOpacity
        onPress={handlePress}
        className={`bg-white rounded-xl p-4 border ${getStatusColor()} shadow-sm`}
        style={animatedStyle}
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-row items-start space-x-3 flex-1">
            <View className="mt-1">
              {getTypeIcon()}
            </View>
            
            <View className="flex-1">
              <View className="flex-row items-center space-x-2 mb-1">
                <Text className="font-semibold text-foreground">
                  {item.childName}
                </Text>
                <View className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
                  {getStatusBadge()}
                </View>
              </View>
              
              <Text className="text-sm text-gray-600 mb-1">
                {item.type === 'pickup' ? 'Récupéré par' : 'Autorisation pour'} {item.collectorName}
              </Text>
              
              <View className="flex-row items-center space-x-2">
                <Calendar size={14} color="#64748B" />
                <Text className="text-xs text-gray-500">
                  {new Date(item.date).toLocaleDateString('fr-FR')} • {item.time}
                </Text>
              </View>
              
              <View className="flex-row items-center space-x-2 mt-1">
                <MapPin size={14} color="#64748B" />
                <Text className="text-xs text-gray-500" numberOfLines={1}>
                  {item.location}
                </Text>
              </View>
            </View>
          </View>
          
          <View className="items-center">
            <Text className="text-xs text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded">
              {item.qrCode}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

HistoryItem.displayName = 'HistoryItem';

export default function HistoryList() {
  const insets = useSafeAreaInsets();
  const [selectedFilter, setSelectedFilter] = React.useState('all');

  const filteredHistory = useMemo(() => {
    if (selectedFilter === 'all') return mockHistory;
    if (selectedFilter === 'failed') {
      return mockHistory.filter(item => item.status === 'failed');
    }
    return mockHistory.filter(item => item.type === selectedFilter);
  }, [selectedFilter]);

  const stats = useMemo(() => ({
    total: mockHistory.length,
    completed: mockHistory.filter(item => item.status === 'completed').length,
    pending: mockHistory.filter(item => item.status === 'pending').length,
    failed: mockHistory.filter(item => item.status === 'failed').length,
  }), []);

  const handleFilterPress = useCallback((filterId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedFilter(filterId);
  }, []);

  const renderHistoryItem = useCallback(({ item, index }: any) => (
    <HistoryItem item={item} index={index} />
  ), []);

  const keyExtractor = useCallback((item: any) => item.id, []);

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <Animated.View 
        entering={FadeInDown.duration(600)}
        className="bg-white border-b border-gray-200 px-4 py-4"
      >
        <View>
          <Text className="text-2xl font-bold text-foreground mb-3">
            Historique
          </Text>
          
          {/* Stats */}
          <View className="flex-row space-x-4 mb-4">
            <View className="flex-1 bg-green-50 rounded-xl p-3 border border-green-200">
              <Text className="text-green-600 text-xl font-bold">
                {stats.completed}
              </Text>
              <Text className="text-green-600 text-xs">
                Succès
              </Text>
            </View>
            
            <View className="flex-1 bg-amber-50 rounded-xl p-3 border border-amber-200">
              <Text className="text-amber-600 text-xl font-bold">
                {stats.pending}
              </Text>
              <Text className="text-amber-600 text-xs">
                En attente
              </Text>
            </View>
            
            <View className="flex-1 bg-red-50 rounded-xl p-3 border border-red-200">
              <Text className="text-red-600 text-xl font-bold">
                {stats.failed}
              </Text>
              <Text className="text-red-600 text-xs">
                Échecs
              </Text>
            </View>
          </View>
          
          {/* Filters */}
          <View className="flex-row space-x-2">
            {filterOptions.map((filter) => (
              <TouchableOpacity
                key={filter.id}
                onPress={() => handleFilterPress(filter.id)}
                className={`flex-1 py-2 px-3 rounded-xl flex-row items-center justify-center space-x-2 ${
                  selectedFilter === filter.id
                    ? 'bg-primary border-primary'
                    : 'bg-gray-100 border-gray-200'
                } border`}
              >
                {filter.icon}
                <Text className={`text-sm font-medium ${
                  selectedFilter === filter.id ? 'text-white' : 'text-gray-600'
                }`}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Animated.View>

      {/* History List */}
      <FlatList
        data={filteredHistory}
        renderItem={renderHistoryItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={{ 
          padding: 16,
          paddingBottom: 100, // Space for tab bar
        }}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 0 }} />}
        ListEmptyComponent={() => (
          <View className="flex-1 items-center justify-center py-12">
            <Clock size={48} color="#64748B" />
            <Text className="text-gray-500 text-center mt-4">
              Aucune activité trouvée pour ce filtre
            </Text>
          </View>
        )}
      />
    </View>
  );
}
