import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'SecuriClick',
  slug: 'securiclick',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'securiclick',
  userInterfaceStyle: 'automatic',

  updates: {
    enabled: false,
  },

  icon: './assets/icons/adaptive-icon.png',

  ios: {
    bundleIdentifier: 'com.shavod.Securiclick',
    googleServicesFile:
      process.env.GOOGLE_SERVICES_PLIST ?? './GoogleService-Info.plist',
    icon: {
      light: './assets/icons/ios-light.png',
      dark: './assets/icons/ios-dark.png',
      tinted: './assets/icons/ios-tinted.png',
    },
    supportsTablet: true,
    buildNumber: '1.0.0',
    infoPlist: {
      NSCameraUsageDescription:
        "SecuriClick a besoin d'accéder à votre caméra pour scanner les QR codes et prendre des photos des enfants.",
      NSPhotoLibraryUsageDescription:
        "SecuriClick a besoin d'accéder à vos photos pour les ajouter aux profils des enfants.",
      NSPhotoLibraryAddUsageDescription:
        "SecuriClick a besoin d'enregistrer des photos dans votre galerie lors des récupérations d'enfants.",
      NSMicrophoneUsageDescription:
        "SecuriClick a besoin d'accéder à votre microphone pour enregistrer des notes vocales lors des récupérations.",
      NSContactsUsageDescription:
        "SecuriClick a besoin d'accéder à vos contacts pour ajouter les personnes autorisées à récupérer les enfants.",
      ITSAppUsesNonExemptEncryption: false,
    },
  },

  android: {
    googleServicesFile: './google-services.json',
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/icons/adaptive-icon.png',
      monochromeImage: './assets/icons/adaptive-icon.png',
    },
    predictiveBackGestureEnabled: false,
    package: 'com.shavod.securiclick',
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [
          {
            scheme: 'securiclick',
            host: 'auth',
            pathPrefix: '/callback',
          },
        ],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
    permissions: [
      'android.permission.CAMERA',
      'android.permission.RECORD_AUDIO',
      'android.permission.READ_CONTACTS',
      'android.permission.WRITE_CONTACTS',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
    ],
  },

  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },

  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#FFFFFF',
        image: './assets/icons/splash-icon-light.png',
        dark: {
          image: './assets/icons/splash-icon-dark.png',
        },
      },
    ],
    'expo-secure-store',
    'expo-image',
    'expo-font',
    [
      'expo-camera',
      {
        cameraPermission:
          'Allow SecuriClick to access your camera for QR code scanning and taking photos',
        microphonePermission:
          'Allow SecuriClick to access your microphone for voice notes during pickups',
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/images/icon.png',
        color: '#208AEF',
        defaultChannel: 'default',
      },
    ],
    [
      'expo-local-authentication',
      {
        faceID: true,
        fingerprint: true,
      },
    ],
    'expo-file-system',
  ],

  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },

  extra: {
    eas: {
      projectId: '858bf27d-7dbe-4355-bb8c-13fc80bb2b24',
    },
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL!,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  },
};

export default config;
