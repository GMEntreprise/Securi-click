import { Stack } from 'expo-router';

export default function ChildrenLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Mes Enfants',
          headerShown: true,
          headerStyle: { backgroundColor: '#F8FAFC' },
          headerTintColor: '#1E3A8A',
        }} 
      />
      <Stack.Screen 
        name="[id]" 
        options={{ 
          title: 'Détails Enfant',
          headerShown: true,
          headerStyle: { backgroundColor: '#F8FAFC' },
          headerTintColor: '#1E3A8A',
        }} 
      />
      <Stack.Screen 
        name="add" 
        options={{ 
          title: 'Ajouter Enfant',
          headerShown: true,
          headerStyle: { backgroundColor: '#F8FAFC' },
          headerTintColor: '#1E3A8A',
          presentation: 'modal',
        }} 
      />
    </Stack>
  );
}
