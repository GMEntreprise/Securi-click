import React, { useEffect } from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  withRepeat,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: W, height: H } = Dimensions.get('window');

const BRAND = '#208AEF';
const BRAND_DARK = '#1570cc';
const BRAND_LIGHT = '#e8f3fd';

export function SplashAnimationScreen() {
  const insets = useSafeAreaInsets();

  // ── Valeurs partagées ─────────────────────────────────────────────────────
  const bgOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.5);
  const logoOpacity = useSharedValue(0);
  const shieldScale = useSharedValue(0.6);
  const shieldOpacity = useSharedValue(0);
  const scanY = useSharedValue(-H * 0.25);
  const scanOpacity = useSharedValue(0);
  const ring1Scale = useSharedValue(0.8);
  const ring1Opacity = useSharedValue(0);
  const ring2Scale = useSharedValue(0.8);
  const ring2Opacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textY = useSharedValue(16);
  const dotOpacity = useSharedValue(0);
  const checkScale = useSharedValue(0);
  const checkOpacity = useSharedValue(0);

  useEffect(() => {
    // 0ms — fond
    bgOpacity.value = withTiming(1, { duration: 300 });

    // 150ms — logo apparaît avec spring
    logoOpacity.value = withDelay(150, withTiming(1, { duration: 350 }));
    logoScale.value = withDelay(
      150,
      withSpring(1, { damping: 14, stiffness: 160 })
    );

    // 400ms — rings de profondeur
    ring1Opacity.value = withDelay(400, withTiming(0.18, { duration: 500 }));
    ring1Scale.value = withDelay(
      400,
      withSpring(1, { damping: 12, stiffness: 80 })
    );
    ring2Opacity.value = withDelay(500, withTiming(0.1, { duration: 500 }));
    ring2Scale.value = withDelay(
      500,
      withSpring(1, { damping: 10, stiffness: 60 })
    );

    // 600ms — shield intérieur
    shieldOpacity.value = withDelay(600, withTiming(1, { duration: 300 }));
    shieldScale.value = withDelay(
      600,
      withSpring(1, { damping: 16, stiffness: 180 })
    );

    // 900ms — scan line traverse de haut en bas
    scanOpacity.value = withDelay(900, withTiming(1, { duration: 200 }));
    scanY.value = withDelay(
      900,
      withTiming(H * 0.25, {
        duration: 900,
        easing: Easing.inOut(Easing.cubic),
      })
    );

    // 1100ms — scan opacity fade out pendant le scan
    setTimeout(() => {
      scanOpacity.value = withSequence(
        withTiming(0.9, { duration: 400 }),
        withTiming(0, { duration: 300 })
      );
    }, 1400);

    // 1800ms — checkmark apparaît (scan réussi)
    checkOpacity.value = withDelay(1800, withTiming(1, { duration: 250 }));
    checkScale.value = withDelay(
      1800,
      withSpring(1, { damping: 12, stiffness: 200 })
    );

    // 2000ms — texte
    textOpacity.value = withDelay(2000, withTiming(1, { duration: 400 }));
    textY.value = withDelay(
      2000,
      withSpring(0, { damping: 18, stiffness: 120 })
    );

    // 2200ms — dots de chargement
    dotOpacity.value = withDelay(
      2200,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 })
        ),
        -1,
        true
      )
    );
  }, []);

  // ── Styles animés ─────────────────────────────────────────────────────────
  const bgStyle = useAnimatedStyle(() => ({ opacity: bgOpacity.value }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const ring1Style = useAnimatedStyle(() => ({
    opacity: ring1Opacity.value,
    transform: [{ scale: ring1Scale.value }],
  }));

  const ring2Style = useAnimatedStyle(() => ({
    opacity: ring2Opacity.value,
    transform: [{ scale: ring2Scale.value }],
  }));

  const shieldStyle = useAnimatedStyle(() => ({
    opacity: shieldOpacity.value,
    transform: [{ scale: shieldScale.value }],
  }));

  const scanStyle = useAnimatedStyle(() => ({
    opacity: scanOpacity.value,
    transform: [{ translateY: scanY.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textY.value }],
  }));

  const dotStyle = useAnimatedStyle(() => ({ opacity: dotOpacity.value }));

  const checkStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
    transform: [{ scale: checkScale.value }],
  }));

  return (
    <View style={styles.root}>
      {/* Fond dégradé animé */}
      <Animated.View style={[StyleSheet.absoluteFill, bgStyle]}>
        <LinearGradient
          colors={['#0a1628', '#0d2147', '#0f2d5e']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Grille légère décorative */}
      <View style={styles.grid} pointerEvents="none">
        {Array.from({ length: 8 }).map((_, i) => (
          <View key={i} style={[styles.gridLine, { top: H * (i * 0.14) }]} />
        ))}
      </View>

      {/* Particules subtiles en arrière-plan */}
      <View style={styles.particles} pointerEvents="none">
        {PARTICLES.map((p, i) => (
          <View
            key={i}
            style={[
              styles.particle,
              {
                left: p.x,
                top: p.y,
                width: p.size,
                height: p.size,
                opacity: p.opacity,
              },
            ]}
          />
        ))}
      </View>

      {/* Zone centrale — logo + shield */}
      <View style={styles.center}>
        {/* Ring externe */}
        <Animated.View style={[styles.ring, styles.ring2, ring2Style]} />

        {/* Ring intermédiaire */}
        <Animated.View style={[styles.ring, styles.ring1, ring1Style]} />

        {/* Container du logo */}
        <Animated.View style={[styles.logoContainer, logoStyle]}>
          {/* Fond du logo */}
          <LinearGradient
            colors={[BRAND, BRAND_DARK]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoGradient}
          />

          {/* Reflet */}
          <View style={styles.logoShine} />

          {/* Ligne de scan */}
          <Animated.View
            style={[styles.scanContainer, scanStyle]}
            pointerEvents="none"
          >
            <LinearGradient
              colors={['transparent', 'rgba(32,138,239,0.9)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.scanLine}
            />
            <View style={styles.scanGlow} />
          </Animated.View>

          {/* Icône shield */}
          <Animated.View style={[styles.shieldIcon, shieldStyle]}>
            <Ionicons name="shield-checkmark" size={64} color="#fff" />
          </Animated.View>

          {/* Checkmark de confirmation */}
          <Animated.View style={[styles.checkBadge, checkStyle]}>
            <LinearGradient
              colors={['#10b981', '#059669']}
              style={styles.checkGradient}
            >
              <Ionicons name="checkmark" size={14} color="#fff" />
            </LinearGradient>
          </Animated.View>
        </Animated.View>

        {/* Coins décoratifs du cadre de scan */}
        <Animated.View style={[styles.corners, logoStyle]} pointerEvents="none">
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </Animated.View>
      </View>

      {/* Texte bas */}
      <Animated.View
        style={[
          styles.textBlock,
          textStyle,
          { paddingBottom: insets.bottom + 48 },
        ]}
      >
        <Text style={styles.appName}>SecuriClick</Text>
        <Text style={styles.tagline}>Sécurité scolaire intelligente</Text>

        {/* Indicateur de chargement */}
        <Animated.View style={[styles.dotsRow, dotStyle]}>
          {[0, 1, 2].map(i => (
            <View key={i} style={styles.dot} />
          ))}
        </Animated.View>
      </Animated.View>
    </View>
  );
}

// ── Données statiques ───────────────────────────────────────────────────────

const PARTICLES = [
  { x: W * 0.08, y: H * 0.12, size: 3, opacity: 0.25 },
  { x: W * 0.88, y: H * 0.08, size: 2, opacity: 0.18 },
  { x: W * 0.15, y: H * 0.72, size: 4, opacity: 0.15 },
  { x: W * 0.82, y: H * 0.68, size: 3, opacity: 0.2 },
  { x: W * 0.5, y: H * 0.05, size: 2, opacity: 0.12 },
  { x: W * 0.92, y: H * 0.4, size: 2, opacity: 0.16 },
  { x: W * 0.05, y: H * 0.45, size: 3, opacity: 0.14 },
  { x: W * 0.6, y: H * 0.88, size: 2, opacity: 0.18 },
  { x: W * 0.25, y: H * 0.9, size: 3, opacity: 0.13 },
  { x: W * 0.75, y: H * 0.22, size: 2, opacity: 0.2 },
];

// ── Styles ──────────────────────────────────────────────────────────────────

const LOGO_SIZE = 140;
const RING1_SIZE = LOGO_SIZE + 60;
const RING2_SIZE = LOGO_SIZE + 110;
const CORNER = 18;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0a1628',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  grid: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 0.5,
    backgroundColor: 'rgba(32,138,239,0.06)',
  },
  particles: {
    ...StyleSheet.absoluteFillObject,
  },
  particle: {
    position: 'absolute',
    borderRadius: 99,
    backgroundColor: BRAND,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BRAND,
  },
  ring1: {
    width: RING1_SIZE,
    height: RING1_SIZE,
  },
  ring2: {
    width: RING2_SIZE,
    height: RING2_SIZE,
  },
  logoContainer: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.55,
    shadowRadius: 32,
    elevation: 20,
  },
  logoGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 36,
  },
  logoShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
  },
  scanContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanLine: {
    width: '100%',
    height: 2,
  },
  scanGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 28,
    backgroundColor: 'rgba(32,138,239,0.18)',
  },
  shieldIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 26,
    height: 26,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#0f2d5e',
  },
  checkGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  corners: {
    position: 'absolute',
    width: LOGO_SIZE + 20,
    height: LOGO_SIZE + 20,
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: 'rgba(32,138,239,0.55)',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopLeftRadius: 6,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderTopRightRadius: 6,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderBottomLeftRadius: 6,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomRightRadius: 6,
  },
  textBlock: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  appName: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  tagline: {
    color: 'rgba(255,255,255,0.50)',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.3,
    marginBottom: 28,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: BRAND,
    opacity: 0.7,
  },
});
