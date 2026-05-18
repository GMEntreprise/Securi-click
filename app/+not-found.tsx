import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAppNavigation } from '@/navigation/useAppNavigation';

export default function NotFound() {
  const nav = useAppNavigation();
  useEffect(() => {
    nav.goToLogin();
  }, [nav]);
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator />
    </View>
  );
}
