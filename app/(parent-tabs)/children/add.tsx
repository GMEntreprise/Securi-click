import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
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
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  Camera,
  Upload,
  Save,
} from 'lucide-react-native';

interface FormData {
  name: string;
  age: string;
  school: string;
  grade: string;
  phone: string;
  email: string;
  address: string;
  emergencyContact: string;
}

const initialFormData: FormData = {
  name: '',
  age: '',
  school: '',
  grade: '',
  phone: '',
  email: '',
  address: '',
  emergencyContact: '',
};

const gradeOptions = [
  'TPS', 'TPS', 'PS', 'MS', 'GS', 'CP', 'CE1', 'CE2', 
  'CM1', 'CM2', '6ème', '5ème', '4ème', '3ème'
];

export default function AddChild() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [formData, setFormData] = React.useState<FormData>(initialFormData);
  const [errors, setErrors] = React.useState<Partial<FormData>>({});

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

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, []);

  const handleInputChange = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  const validateForm = useCallback(() => {
    const newErrors: Partial<FormData> = {};

    if (!formData.name.trim()) newErrors.name = 'Le nom est requis';
    if (!formData.age.trim() || isNaN(Number(formData.age))) {
      newErrors.age = 'L\'âge doit être un nombre valide';
    }
    if (!formData.school.trim()) newErrors.school = 'L\'école est requise';
    if (!formData.grade.trim()) newErrors.grade = 'La classe est requise';
    if (!formData.phone.trim()) newErrors.phone = 'Le téléphone est requis';
    if (!formData.email.trim() || !formData.email.includes('@')) {
      newErrors.email = 'L\'email est invalide';
    }
    if (!formData.address.trim()) newErrors.address = 'L\'adresse est requise';
    if (!formData.emergencyContact.trim()) {
      newErrors.emergencyContact = 'Le contact d\'urgence est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSave = useCallback(() => {
    scale.value = 0.95;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    setTimeout(() => {
      scale.value = 1;
      
      if (validateForm()) {
        // TODO: Save to backend
        Alert.alert(
          'Succès',
          `${formData.name} a été ajouté avec succès !`,
          [
            {
              text: 'OK',
              onPress: () => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                router.back();
              },
            },
          ]
        );
      }
    }, 100);
  }, [formData, validateForm]);

  const sections = useMemo(() => [
    {
      title: 'Informations personnelles',
      icon: <User size={20} color="#1E3A8A" />,
      fields: [
        { key: 'name', label: 'Nom complet', placeholder: 'Entrez le nom de l\'enfant', keyboardType: 'default' },
        { key: 'age', label: 'Âge', placeholder: 'Entrez l\'âge', keyboardType: 'numeric' },
      ],
    },
    {
      title: 'Scolarité',
      icon: <Calendar size={20} color="#1E3A8A" />,
      fields: [
        { key: 'school', label: 'École', placeholder: 'Entrez le nom de l\'école', keyboardType: 'default' },
        { key: 'grade', label: 'Classe', placeholder: 'Sélectionnez la classe', keyboardType: 'default' },
      ],
    },
    {
      title: 'Contact',
      icon: <Phone size={20} color="#1E3A8A" />,
      fields: [
        { key: 'phone', label: 'Téléphone', placeholder: 'Entrez le numéro', keyboardType: 'phone-pad' },
        { key: 'email', label: 'Email', placeholder: 'Entrez l\'email', keyboardType: 'email-address' },
      ],
    },
    {
      title: 'Localisation',
      icon: <MapPin size={20} color="#1E3A8A" />,
      fields: [
        { key: 'address', label: 'Adresse', placeholder: 'Entrez l\'adresse complète', keyboardType: 'default' },
        { key: 'emergencyContact', label: 'Contact d\'urgence', placeholder: 'Nom et téléphone', keyboardType: 'default' },
      ],
    },
  ], []);

  const renderInput = useCallback((field: any) => (
    <View className="mb-4">
      <Text className="text-sm font-medium text-foreground mb-2">
        {field.label}
      </Text>
      <TextInput
        value={formData[field.key as keyof FormData]}
        onChangeText={(value) => handleInputChange(field.key as keyof FormData, value)}
        placeholder={field.placeholder}
        keyboardType={field.keyboardType}
        className={`w-full px-4 py-3 bg-white border rounded-xl ${
          errors[field.key as keyof FormData]
            ? 'border-red-300 bg-red-50'
            : 'border-gray-200'
        }`}
        style={{ fontSize: 16 }}
      />
      {errors[field.key as keyof FormData] && (
        <View className="flex-row items-center mt-2">
          <AlertCircle size={14} color="#EF4444" />
          <Text className="text-red-500 text-sm ml-2">
            {errors[field.key as keyof FormData]}
          </Text>
        </View>
      )}
    </View>
  ), [formData, errors, handleInputChange]);

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
                Ajouter un enfant
              </Text>
              <Text className="text-sm text-gray-500">
                Remplissez les informations de votre enfant
              </Text>
            </View>
          </Animated.View>

          {/* Form Sections */}
          <View className="space-y-6">
            {sections.map((section, sectionIndex) => (
              <Animated.View
                key={section.title}
                entering={FadeInDown.delay(sectionIndex * 100).duration(600)}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
              >
                <View className="flex-row items-center mb-4">
                  {section.icon}
                  <Text className="text-lg font-semibold text-foreground ml-3">
                    {section.title}
                  </Text>
                </View>
                
                {section.fields.map((field: any) => renderInput(field))}
              </Animated.View>
            ))}
          </View>

          {/* Photo Section */}
          <Animated.View 
            entering={FadeInDown.delay(400).duration(600)}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6"
          >
            <Text className="text-lg font-semibold text-foreground mb-4">
              Photo
            </Text>
            <View className="flex-row space-x-4">
              <TouchableOpacity
                className="flex-1 h-24 bg-gray-50 rounded-xl items-center justify-center border-2 border-dashed border-gray-300"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  // TODO: Open camera
                }}
              >
                <Camera size={24} color="#64748B" />
                <Text className="text-sm text-gray-500 mt-2">
                  Prendre photo
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                className="flex-1 h-24 bg-gray-50 rounded-xl items-center justify-center border-2 border-dashed border-gray-300"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  // TODO: Open gallery
                }}
              >
                <Upload size={24} color="#64748B" />
                <Text className="text-sm text-gray-500 mt-2">
                  Galerie
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Save Button */}
          <Animated.View 
            entering={FadeInDown.delay(500).duration(600)}
            className="mb-6"
          >
            <TouchableOpacity
              onPress={handleSave}
              className="bg-primary rounded-2xl py-4 flex-row items-center justify-center shadow-lg"
              style={animatedStyle}
            >
              <Save size={20} color="white" />
              <Text className="text-white font-semibold text-lg ml-2">
                Enregistrer l'enfant
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}
