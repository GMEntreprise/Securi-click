import { BlurView } from 'expo-blur';
import { Image, ImageSource } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { memo } from 'react';
import { Dimensions, View } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.38;

interface AuthHeroImageProps {
  source: ImageSource;
  children?: React.ReactNode;
}

export const AuthHeroImage: React.FC<AuthHeroImageProps> = memo(
  ({ source, children }) => {
    return (
      <View style={{ height: HERO_HEIGHT }}>
        <Image
          source={source}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
          }}
          contentFit="cover"
        />
        <LinearGradient
          colors={[
            'transparent',
            'rgba(249,245,240,0.4)',
            'rgba(249,245,240,1)',
          ]}
          locations={[0.4, 0.75, 1]}
          style={{ position: 'absolute', inset: 0 }}
        />
        {children && (
          <View style={{ position: 'absolute', inset: 0 }}>{children}</View>
        )}
      </View>
    );
  }
);

AuthHeroImage.displayName = 'AuthHeroImage';
