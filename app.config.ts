import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Securiclick',
  slug: 'securiclick',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'securiclick',
  userInterfaceStyle: 'automatic',

  icon: './assets/icons/adaptive-icon.png',

  ios: {
    bundleIdentifier: 'com.shavod.Securiclick',
    icon: {
      light: './assets/icons/ios-light.png',
      dark: './assets/icons/ios-dark.png',
      tinted: './assets/icons/ios-tinted.png',
    },
    supportsTablet: true,
  },

  android: {
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/icons/adaptive-icon.png',
      monochromeImage: './assets/icons/adaptive-icon.png',
    },
    predictiveBackGestureEnabled: false,
    package: 'com.shavod.Securiclick',
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
        backgroundColor: '#208AEF',
        image: './assets/icons/splash-icon-light.png',
        dark: {
          image: './assets/icons/splash-icon-dark.png',
        },
        android: {
          image: './assets/icons/splash-icon-light.png',
          imageWidth: 76,
        },
      },
    ],
    'expo-secure-store',
    'expo-image',
    'expo-font',
    [
      'expo-camera',
      {
        cameraPermission: 'Allow $(PRODUCT_NAME) to access your camera',
        microphonePermission: 'Allow $(PRODUCT_NAME) to access your microphone',
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/images/icon.png',
        color: '#208AEF',
      },
    ],
    [
      'expo-local-authentication',
      {
        faceID: true,
        fingerprint: true,
      },
    ],
  ],

  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },

  extra: {
    eas: {
      projectId: 'your-project-id',
    },
  },
};

export default config;
