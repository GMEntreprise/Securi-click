import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { curvedTabBarVisualHeight } from '@/constants/tabBar';
import { useAuthStore } from '@/features/auth/store/auth.store';

export default function ProfileTabScreen() {
  const { bottom } = useSafeAreaInsets();
  const logout = useAuthStore(s => s.logout);

  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-black"
      edges={['top', 'left', 'right']}
      style={{ paddingBottom: curvedTabBarVisualHeight + bottom }}
    >
      <View className="flex-1 items-center justify-center px-4">
        <Text className="text-lg font-semibold text-gray-900 dark:text-white">
          Profil
        </Text>
        <Text className="mt-2 text-center text-gray-600 dark:text-gray-400">
          Compte, enfants et réglages (à brancher).
        </Text>

        <Pressable
          className="mt-8 bg-gray-200 dark:bg-gray-800 px-6 py-3 rounded-xl"
          onPress={() => {
            void logout();
          }}
        >
          <Text className="text-gray-900 dark:text-white font-medium">
            Se déconnecter
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
