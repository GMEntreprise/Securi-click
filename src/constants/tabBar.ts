import { Dimensions } from 'react-native';

/**
 * Hauteur visuelle de la barre courbe (alignée sur CurvedBottomTabs : barHeight × VIEWPORT_HEIGHT).
 * À combiner avec useSafeAreaInsets().bottom pour le padding du contenu.
 */
const screenHeight = Dimensions.get('window').height;
const VIEWPORT_HEIGHT = screenHeight / 100;
const DEFAULT_BAR_HEIGHT_UNITS = 9;

export const curvedTabBarVisualHeight = Math.ceil(
  VIEWPORT_HEIGHT * DEFAULT_BAR_HEIGHT_UNITS
);
