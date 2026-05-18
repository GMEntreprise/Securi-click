import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Camera, Image as ImageIcon, Trash2, X } from 'lucide-react-native';
import { useTheme } from '@/theme';

export interface AvatarPickerSheetProps {
  visible: boolean;
  hasPhoto: boolean;
  onCamera: () => void;
  onGallery: () => void;
  onRemove: () => void;
  onClose: () => void;
}

interface OptionRowProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  iconBg: string;
  onPress: () => void;
  destructive?: boolean;
  isLast?: boolean;
}

function OptionRow({
  icon,
  label,
  description,
  iconBg,
  onPress,
  destructive = false,
  isLast = false,
}: OptionRowProps) {
  const theme = useTheme();
  return (
    <TouchableOpacity
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      activeOpacity={0.7}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
        gap: 14,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: theme.separator,
      }}
    >
      <View
        style={{
          width: 46,
          height: 46,
          borderRadius: 14,
          backgroundColor: iconBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: destructive ? theme.red : theme.text,
            fontSize: 15,
            fontWeight: '700',
          }}
        >
          {label}
        </Text>
        <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>
          {description}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export function AvatarPickerSheet({
  visible,
  hasPhoto,
  onCamera,
  onGallery,
  onRemove,
  onClose,
}: AvatarPickerSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  // Keep the Modal mounted during the closing animation
  const [mounted, setMounted] = useState(false);
  const closingRef = useRef(false);

  const translateY = useSharedValue(500);
  const opacity = useSharedValue(0);

  const animateIn = useCallback(() => {
    closingRef.current = false;
    opacity.value = withTiming(1, { duration: 240 });
    translateY.value = withSpring(0, {
      damping: 26,
      stiffness: 280,
      mass: 0.8,
      overshootClamping: true,
    });
  }, [opacity, translateY]);

  const animateOut = useCallback(
    (cb: () => void) => {
      if (closingRef.current) return;
      closingRef.current = true;
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(
        500,
        { duration: 240 },
        finished => {
          if (finished) runOnJS(cb)();
        }
      );
    },
    [opacity, translateY]
  );

  useEffect(() => {
    if (visible) {
      setMounted(true);
      // Let the Modal fully appear before animating in
      requestAnimationFrame(() => animateIn());
    } else if (mounted) {
      animateOut(() => {
        setMounted(false);
        onClose();
      });
    }
  // onClose intentionally excluded — stable callback, avoid loop
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleBackdropPress = useCallback(() => {
    if (!closingRef.current) {
      animateOut(() => {
        setMounted(false);
        onClose();
      });
    }
  }, [animateOut, onClose]);

  const handleOption = useCallback(
    (action: () => void) => {
      animateOut(() => {
        setMounted(false);
        onClose();
        action();
      });
    },
    [animateOut, onClose]
  );

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!mounted) return null;

  return (
    <Modal
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleBackdropPress}
    >
      {/* Backdrop */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.48)',
          },
          backdropStyle,
        ]}
      >
        <Pressable style={{ flex: 1 }} onPress={handleBackdropPress} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: theme.card,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingBottom: insets.bottom + 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: 0.1,
            shadowRadius: 20,
            elevation: 24,
          },
          sheetStyle,
        ]}
      >
        {/* Drag handle */}
        <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
          <View
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: theme.inputBorder,
            }}
          />
        </View>

        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingTop: 10,
            paddingBottom: 14,
          }}
        >
          <Text style={{ color: theme.text, fontSize: 17, fontWeight: '800' }}>
            Photo de profil
          </Text>
          <TouchableOpacity
            onPress={handleBackdropPress}
            hitSlop={8}
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              backgroundColor: theme.iconBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={15} color={theme.textSecondary} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: theme.separator }} />

        {/* Options */}
        <View>
          <OptionRow
            icon={<Camera size={21} color={theme.accent} strokeWidth={2} />}
            iconBg={theme.accentBg}
            label="Prendre une photo"
            description="Ouvrir l'appareil photo"
            onPress={() => handleOption(onCamera)}
          />
          <OptionRow
            icon={<ImageIcon size={21} color={theme.primary} strokeWidth={2} />}
            iconBg={theme.primaryBg}
            label="Choisir dans la galerie"
            description="Sélectionner depuis vos photos"
            onPress={() => handleOption(onGallery)}
          />
          {hasPhoto && (
            <OptionRow
              icon={<Trash2 size={21} color={theme.red} strokeWidth={2} />}
              iconBg={theme.redBg}
              label="Supprimer la photo"
              description="Revenir à l'avatar par défaut"
              destructive
              isLast
              onPress={() => handleOption(onRemove)}
            />
          )}
          {!hasPhoto && <View style={{ height: 6 }} />}
        </View>
      </Animated.View>
    </Modal>
  );
}
