import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  FadeInDown,
  LayoutAnimationConfig,
  interpolateColor,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import {
  Shield,
  QrCode,
  RefreshCw,
  Lock,
  CheckCircle,
  AlertCircle,
  Smartphone,
  User,
} from 'lucide-react-native';

// Mock data - will be replaced with real hooks
const mockQRData = {
  code: 'SC-EMMA-001',
  childName: 'Emma',
  validUntil: '2024-12-31',
  isActive: true,
  lastGenerated: '2024-01-15 10:30',
};

const mockRecentScans = [
  {
    id: '1',
    collectorName: 'Jean Dupont',
    time: '14:30',
    date: 'Aujourd\'hui',
    status: 'success',
    location: 'École Primaire Saint-Exupéry',
  },
  {
    id: '2',
    collectorName: 'Marie Martin',
    time: '08:15',
    date: 'Hier',
    status: 'success',
    location: 'Portail principal',
  },
];

export default function QRDisplay() {
  const insets = useSafeAreaInsets();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: withSpring(scale.value, {
          damping: 15,
          stiffness: 300,
        }),
      },
      {
        rotate: withSpring(rotation.value, {
          damping: 20,
          stiffness: 200,
        }),
      },
    ],
    shadowColor: interpolateColor(
      glowOpacity.value,
      [0, 1],
      ['transparent', '#10B981'],
    ),
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: glowOpacity.value,
    shadowRadius: glowOpacity.value * 20,
    elevation: glowOpacity.value * 20,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [
      {
        scale: withSpring(glowOpacity.value * 1.2 + 0.8, {
          damping: 15,
          stiffness: 300,
        }),
      },
    ],
  }));

  const handleGenerateQR = useCallback(async () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Authentification requise',
        'Veuillez vous authentifier avec Face ID ou votre empreinte pour générer le QR code.',
        [
          {
            text: 'Annuler',
            style: 'cancel',
          },
          {
            text: 'S\'authentifier',
            onPress: handleBiometricAuth,
          },
        ]
      );
      return;
    }

    setIsGenerating(true);
    scale.value = 0.9;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Animate rotation
    rotation.value = withSequence(
      withTiming(360, { duration: 1000 }),
      withTiming(0, { duration: 0 })
    );

    // Animate glow
    glowOpacity.value = withSequence(
      withTiming(1, { duration: 300 }),
      withTiming(0.3, { duration: 200 }),
      withTiming(1, { duration: 200 }),
      withTiming(0, { duration: 300 })
    );

    setTimeout(() => {
      scale.value = 1;
      setIsGenerating(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 1500);
  }, [isAuthenticated, scale, rotation, glowOpacity]);

  const handleBiometricAuth = useCallback(async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authentifiez-vous pour accéder au QR code',
        fallbackLabel: 'Utiliser le code',
        cancelLabel: 'Annuler',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setIsAuthenticated(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Échec', 'L\'authentification a échoué. Veuillez réessayer.');
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'authentification.');
    }
  }, []);

  const handleRefresh = useCallback(() => {
    setIsAuthenticated(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const getStatusColor = () => {
    return mockQRData.isActive ? 'text-green-500' : 'text-gray-500';
  };

  const getDaysUntilExpiry = useMemo(() => {
    const expiry = new Date(mockQRData.validUntil);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [mockQRData.validUntil]);

  useEffect(() => {
    // Auto-auth check on mount
    handleBiometricAuth();
  }, []);

  return (
    <View className="flex-1 bg-gradient-to-b from-blue-50 to-white">
      <View className="flex-1 px-4 pt-8" style={{ paddingBottom: insets.bottom + 80 }}>
        {/* Header */}
        <Animated.View 
          entering={FadeInDown.duration(600)}
          className="items-center mb-8"
        >
          <Text className="text-3xl font-bold text-foreground mb-2">
            QR Code Sécurisé
          </Text>
          <Text className="text-gray-500 text-center text-base">
            {mockQRData.childName} • {mockQRData.code}
          </Text>
        </Animated.View>

        {/* QR Code Display */}
        <Animated.View 
          entering={FadeInDown.delay(100).duration(600)}
          className="flex-1 items-center justify-center"
        >
          <View className="relative">
            {/* Glow Effect */}
            <Animated.View
              style={[
                glowStyle,
                {
                  position: 'absolute',
                  width: 200,
                  height: 200,
                  borderRadius: 24,
                  backgroundColor: '#10B981',
                  opacity: 0.1,
                }
              ]}
              className="items-center justify-center"
            />

            {/* QR Code Container */}
            <Animated.View
              style={animatedStyle}
              className="w-48 h-48 bg-white rounded-2xl items-center justify-center shadow-xl border-2 border-green-200"
            >
              {isAuthenticated ? (
                <View className="items-center">
                  <QrCode size={120} color="#1E3A8A" strokeWidth={2} />
                  <Text className="text-xs text-gray-400 mt-2 font-mono">
                    {mockQRData.code}
                  </Text>
                </View>
              ) : (
                <View className="items-center">
                  <Lock size={60} color="#64748B" />
                  <Text className="text-gray-500 text-sm mt-3 text-center">
                    QR code verrouillé
                  </Text>
                </View>
              )}
            </Animated.View>
          </View>

          {/* Status Info */}
          <View className="mt-8 items-center">
            <View className="flex-row items-center space-x-2 mb-3">
              {mockQRData.isActive ? (
                <CheckCircle size={20} color="#10B981" />
              ) : (
                <AlertCircle size={20} color="#EF4444" />
              )}
              <Text className={`font-semibold ${getStatusColor()}`}>
                {mockQRData.isActive ? 'QR Code Actif' : 'QR Code Inactif'}
              </Text>
            </View>

            <Text className="text-sm text-gray-500 text-center mb-4">
              Valide jusqu'au {new Date(mockQRData.validUntil).toLocaleDateString('fr-FR')}
              {' '}• {getDaysUntilExpiry} jours restants
            </Text>

            {/* Action Buttons */}
            <View className="space-y-3 w-full">
              <TouchableOpacity
                onPress={handleGenerateQR}
                disabled={isGenerating}
                className={`w-full py-4 rounded-2xl flex-row items-center justify-center shadow-lg ${
                  isAuthenticated
                    ? 'bg-primary'
                    : 'bg-gray-300'
                }`}
                style={[
                  animatedStyle,
                  { minHeight: 56 }
                ]}
              >
                {isGenerating ? (
                  <RefreshCw size={20} color="white" />
                ) : isAuthenticated ? (
                  <QrCode size={20} color="white" />
                ) : (
                  <Lock size={20} color="white" />
                )}
                <Text className="text-white font-semibold text-lg ml-2">
                  {isGenerating
                    ? 'Génération...'
                    : isAuthenticated
                      ? 'Régénérer QR'
                      : 'Déverrouiller QR'
                  }
                </Text>
              </TouchableOpacity>

              {isAuthenticated && (
                <TouchableOpacity
                  onPress={handleRefresh}
                  className="w-full py-3 rounded-xl border border-gray-300 flex-row items-center justify-center bg-white"
                >
                  <Smartphone size={18} color="#64748B" />
                  <Text className="text-gray-600 font-medium ml-2">
                    Nouvelle authentification
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Recent Scans */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)}>
          <Text className="text-lg font-semibold text-foreground mb-4">
            Scans récents
          </Text>
          
          <View className="space-y-3">
            {mockRecentScans.slice(0, 3).map((scan, index) => (
              <View key={scan.id} className="bg-white rounded-xl p-3 border border-gray-100">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center space-x-2 mb-1">
                      <User size={16} color="#1E3A8A" />
                      <Text className="font-medium text-foreground">
                        {scan.collectorName}
                      </Text>
                    </View>
                    <Text className="text-sm text-gray-500">
                      {scan.location} • {scan.date} à {scan.time}
                    </Text>
                  </View>
                  <View className={`w-2 h-2 rounded-full ${
                    scan.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                </View>
              </View>
            ))}
          </View>
        </Animated.View>
      </View>
    </View>
  );
}
