import { Stack } from 'expo-router';

export default function HistoryLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Historique',
          headerShown: true,
          headerStyle: { backgroundColor: '#F8FAFC' },
          headerTintColor: '#1E3A8A',
        }} 
      />
    </Stack>
  );
}
