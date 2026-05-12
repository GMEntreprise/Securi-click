import React, { useMemo, useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
  ArrowLeft,
  Shield,
  Clock,
  MapPin,
  Phone,
  Mail,
  Calendar,
  ToggleLeft,
  ToggleRight,
  User,
  AlertCircle,
} from 'lucide-react-native';

// Mock data - will be replaced with real hooks
const mockChild = {
  id: '1',
  name: 'Emma',
  age: 8,
  school: 'École Primaire Saint-Exupéry',
  grade: 'CE2',
  avatar: '👧',
  phone: '06 12 34 56 78',
  email: 'emma.parent@email.com',
  address: '123 Rue de la Paix, 75001 Paris',
  emergencyContact: 'Marie Dupont - 06 98 76 54 32',
};

const mockAuthorizations = [
  {
    id: '1',
    collectorName: 'Jean Dupont',
    collectorPhone: '06 11 22 33 44',
    relationship: 'Grand-père',
    validUntil: '2024-12-31',
    isActive: true,
    qrCode: 'SC-EMMA-001',
  },
  {
    id: '2',
    collectorName: 'Marie Martin',
    collectorPhone: '06 55 66 77 88',
    relationship: 'Tante',
    validUntil: '2024-11-30',
    isActive: false,
    qrCode: 'SC-EMMA-002',
  },
];

interface AuthorizationCardProps {
  item: any;
  index: number;
  onToggle: (id: string) => void;
}

const AuthorizationCard = React.memo(({ item, index, onToggle }: AuthorizationCardProps) => {
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

  const handleToggle = useCallback(() => {
    scale.value = 0.95;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => {
      scale.value = 1;
      onToggle(item.id);
    }, 100);
  }, [item.id, onToggle]);

  const getStatusColor = () => {
    return item.isActive ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200';
  };

  const getBadgeColor = () => {
    return item.isActive ? 'bg-green-500' : 'bg-gray-500';
  };

  const daysUntilExpiry = useMemo(() => {
    const expiry = new Date(item.validUntil);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [item.validUntil]);

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(400)}
      className="mb-4"
    >
      <View className={`bg-white rounded-2xl p-4 border ${getStatusColor()} shadow-sm`}>
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-1">
            <View className="flex-row items-center space-x-2 mb-1">
              <View className={`w-2 h-2 rounded-full ${getBadgeColor()}`} />
              <Text className="font-semibold text-foreground">
                {item.collectorName}
              </Text>
            </View>
            <Text className="text-sm text-gray-500">
              {item.relationship}
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={handleToggle}
            className="w-12 h-12 rounded-full items-center justify-center bg-gray-100"
            style={animatedStyle}
          >
            {item.isActive ? (
              <ToggleRight size={20} color="#10B981" />
            ) : (
              <ToggleLeft size={20} color="#64748B" />
            )}
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center space-x-4 mb-3">
          <View className="flex-row items-center space-x-2">
            <Phone size={14} color="#64748B" />
            <Text className="text-sm text-gray-600">{item.collectorPhone}</Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center space-x-2">
            <Calendar size={14} color="#64748B" />
            <Text className="text-sm text-gray-600">
              Valide jusqu'au {new Date(item.validUntil).toLocaleDateString('fr-FR')}
            </Text>
          </View>
          
          <View className={`px-2 py-1 rounded-full ${
            daysUntilExpiry <= 7 
              ? 'bg-red-100' 
              : daysUntilExpiry <= 30 
                ? 'bg-amber-100' 
                : 'bg-green-100'
          }`}>
            <Text className={`text-xs font-medium ${
              daysUntilExpiry <= 7 
                ? 'text-red-600' 
                : daysUntilExpiry <= 30 
                  ? 'text-amber-600' 
                  : 'text-green-600'
            }`}>
              {daysUntilExpiry <= 0 
                ? 'Expirée' 
                : daysUntilExpiry === 1 
                  ? '1 jour' 
                  : `${daysUntilExpiry} jours`
              }
            </Text>
          </View>
        </View>

        <View className="mt-3 pt-3 border-t border-gray-100">
          <Text className="text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded">
            QR: {item.qrCode}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
});

AuthorizationCard.displayName = 'AuthorizationCard';

export default function ChildDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [authorizations, setAuthorizations] = useState(mockAuthorizations);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, []);

  const handleToggleAuthorization = useCallback((authId: string) => {
    setAuthorizations(prev => 
      prev.map(auth => 
        auth.id === authId 
          ? { ...auth, isActive: !auth.isActive }
          : auth
      )
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const activeAuthorizations = useMemo(() => 
    authorizations.filter(auth => auth.isActive).length,
    [authorizations]
  );

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4 pt-4" style={{ paddingBottom: insets.bottom + 80 }}>
          {/* Header */}
          <Animated.View 
            entering={FadeInDown.duration(600)}
            className="flex-row items-center mb-6"
          >
            <TouchableOpacity
              onPress={handleBack}
              className="w-10 h-10 rounded-full items-center justify-center bg-white shadow-sm mr-4"
            >
              <ArrowLeft size={20} color="#1E3A8A" />
            </TouchableOpacity>
            
            <View className="flex-1">
              <Text className="text-2xl font-bold text-foreground mb-1">
                {mockChild.name}
              </Text>
              <Text className="text-sm text-gray-500">
                {mockChild.age} ans • {mockChild.grade}
              </Text>
            </View>
          </Animated.View>

          {/* Child Info Card */}
          <Animated.View 
            entering={FadeInDown.delay(100).duration(600)}
            className="bg-white rounded-2xl p-4 mb-6 shadow-sm border border-gray-100"
          >
            <View className="flex-row items-center space-x-4 mb-4">
              <View className="w-20 h-20 bg-primary rounded-2xl items-center justify-center">
                <Text className="text-4xl">{mockChild.avatar}</Text>
              </View>
              
              <View className="flex-1">
                <Text className="text-lg font-bold text-foreground mb-1">
                  {mockChild.name}
                </Text>
                <Text className="text-sm text-gray-500 mb-2">
                  {mockChild.school}
                </Text>
                <View className="flex-row items-center space-x-2">
                  <Shield size={16} color="#10B981" />
                  <Text className="text-sm text-green-600 font-medium">
                    {activeAuthorizations} autorisation{activeAuthorizations > 1 ? 's' : ''} active{activeAuthorizations > 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            </View>

            <View className="space-y-3">
              <View className="flex-row items-center space-x-3">
                <Phone size={16} color="#64748B" />
                <Text className="text-sm text-gray-600">{mockChild.phone}</Text>
              </View>
              
              <View className="flex-row items-center space-x-3">
                <Mail size={16} color="#64748B" />
                <Text className="text-sm text-gray-600">{mockChild.email}</Text>
              </View>
              
              <View className="flex-row items-center space-x-3">
                <MapPin size={16} color="#64748B" />
                <Text className="text-sm text-gray-600">{mockChild.address}</Text>
              </View>
              
              <View className="flex-row items-center space-x-3">
                <AlertCircle size={16} color="#EF4444" />
                <Text className="text-sm text-gray-600">
                  Contact d'urgence: {mockChild.emergencyContact}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Authorizations */}
          <Animated.View entering={FadeInDown.delay(200).duration(600)}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">
                Autorisations
              </Text>
              <TouchableOpacity>
                <Text className="text-primary text-sm font-medium">
                  Ajouter
                </Text>
              </TouchableOpacity>
            </View>

            <View>
              {authorizations.map((auth, index) => (
                <AuthorizationCard
                  key={auth.id}
                  item={auth}
                  index={index}
                  onToggle={handleToggleAuthorization}
                />
              ))}
            </View>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}
