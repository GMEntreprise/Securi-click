import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Profil',
          headerShown: true,
          headerStyle: { backgroundColor: '#F8FAFC' },
          headerTintColor: '#1E3A8A',
        }} 
      />
    </Stack>
  );
}
