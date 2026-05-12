import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Securiclick',
  slug: 'securiclick',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'securiclick',
  userInterfaceStyle: 'automatic',

  icon: './assets/images/icon.png',

  ios: {
    bundleIdentifier: 'com.shavod.Securiclick',
    icon: './assets/expo.icon',
    supportsTablet: true,
  },

  android: {
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
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
        android: {
          image: './assets/images/splash-icon.png',
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
