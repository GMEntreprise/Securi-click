import React from 'react';
import { Redirect } from 'expo-router';

export const CollectorAuthScreen: React.FC = () => (
  <Redirect href={'/(auth)/collector-pin' as any} />
);

CollectorAuthScreen.displayName = 'CollectorAuthScreen';
