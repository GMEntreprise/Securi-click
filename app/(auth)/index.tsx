import React from 'react';
import { Redirect } from 'expo-router';
import { useIsAuthenticated } from '@/features/auth/store/auth.store';
import { RolePicker } from '@/features/auth/components/RolePicker';

export default function AuthIndex() {
  const isAuthenticated = useIsAuthenticated();

  // Redirect authenticated users to app
  if (isAuthenticated) {
    return <Redirect href="/(app)" />;
  }

  return <RolePicker />;
}
