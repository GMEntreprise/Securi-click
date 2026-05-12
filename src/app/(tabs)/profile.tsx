import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { curvedTabBarVisualHeight } from '@/constants/tabBar';

export default function ProfileTabScreen() {
  const { bottom } = useSafeAreaInsets();

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
          Contenu à brancher (compte, enfants, réglages…).
        </Text>
      </View>
    </SafeAreaView>
  );
}
