import { Stack } from 'expo-router';

export default function QRLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'QR Code',
          headerShown: false,
        }} 
      />
    </Stack>
  );
}
