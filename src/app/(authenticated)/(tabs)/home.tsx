import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { curvedTabBarVisualHeight } from '@/constants/tabBar';

export default function HomeTabScreen() {
  const { bottom } = useSafeAreaInsets();

  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-black"
      edges={['top', 'left', 'right']}
      style={{ paddingBottom: curvedTabBarVisualHeight + bottom }}
    >
      <View className="flex-1 items-center justify-center px-4">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          SecuriClick
        </Text>
        <Text className="text-center text-gray-600 dark:text-gray-400">
          Welcome to your secure mobile application
        </Text>
      </View>
    </SafeAreaView>
  );
}
