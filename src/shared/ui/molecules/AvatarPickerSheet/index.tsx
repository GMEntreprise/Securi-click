import React, { useCallback, useEffect } from 'react';
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
        paddingVertical: 14,
        paddingHorizontal: 20,
        gap: 14,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: theme.separator,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
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
        <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 1 }}>
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

  const translateY = useSharedValue(400);
  const opacity = useSharedValue(0);

  const open = useCallback(() => {
    opacity.value = withTiming(1, { duration: 200 });
    translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
  }, [opacity, translateY]);

  const close = useCallback(
    (cb?: () => void) => {
      opacity.value = withTiming(0, { duration: 180 });
      translateY.value = withTiming(400, { duration: 220 }, finished => {
        if (finished && cb) runOnJS(cb)();
      });
    },
    [opacity, translateY]
  );

  useEffect(() => {
    if (visible) open();
  }, [visible, open]);

  const handleClose = useCallback(() => {
    close(onClose);
  }, [close, onClose]);

  const handleOption = useCallback(
    (action: () => void) => {
      close(() => {
        onClose();
        action();
      });
    },
    [close, onClose]
  );

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" onRequestClose={handleClose}>
      {/* Backdrop */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.45)',
          },
          backdropStyle,
        ]}
      >
        <Pressable style={{ flex: 1 }} onPress={handleClose} />
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
            paddingBottom: insets.bottom + 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.12,
            shadowRadius: 16,
            elevation: 20,
          },
          sheetStyle,
        ]}
      >
        {/* Handle */}
        <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 8 }}>
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
            paddingBottom: 12,
          }}
        >
          <Text style={{ color: theme.text, fontSize: 17, fontWeight: '800' }}>
            Photo de profil
          </Text>
          <TouchableOpacity
            onPress={handleClose}
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

        {/* Separator */}
        <View style={{ height: 1, backgroundColor: theme.separator }} />

        {/* Options */}
        <View>
          <OptionRow
            icon={<Camera size={20} color={theme.accent} strokeWidth={2} />}
            iconBg={theme.accentBg}
            label="Prendre une photo"
            description="Ouvrir l'appareil photo"
            onPress={() => handleOption(onCamera)}
          />
          <OptionRow
            icon={<ImageIcon size={20} color={theme.primary} strokeWidth={2} />}
            iconBg={theme.primaryBg}
            label="Choisir dans la galerie"
            description="Sélectionner depuis vos photos"
            onPress={() => handleOption(onGallery)}
          />
          {hasPhoto && (
            <OptionRow
              icon={<Trash2 size={20} color={theme.red} strokeWidth={2} />}
              iconBg={theme.redBg}
              label="Supprimer la photo"
              description="Revenir à l'avatar par défaut"
              destructive
              isLast
              onPress={() => handleOption(onRemove)}
            />
          )}
          {!hasPhoto && (
            <View style={{ height: 4 }} />
          )}
        </View>
      </Animated.View>
    </Modal>
  );
}
