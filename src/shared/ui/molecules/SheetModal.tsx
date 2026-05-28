import React from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type ModalProps,
} from 'react-native';

interface SheetModalProps extends Omit<
  ModalProps,
  'animationType' | 'presentationStyle'
> {
  onRequestClose: () => void;
  children: React.ReactNode;
}

/**
 * Cross-platform pageSheet-style modal.
 * - iOS: delegates to the native `pageSheet` presentation.
 * - Android: `presentationStyle` is ignored by the OS, so we simulate the
 *   partial-screen feel with a transparent overlay at the top (~35% of screen)
 *   that dismisses the sheet when tapped.
 */
export function SheetModal({
  onRequestClose,
  children,
  ...rest
}: SheetModalProps) {
  if (Platform.OS !== 'android') {
    return (
      <Modal
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onRequestClose}
        {...rest}
      >
        {children}
      </Modal>
    );
  }

  return (
    <Modal animationType="slide" onRequestClose={onRequestClose} {...rest}>
      <Pressable style={styles.backdrop} onPress={onRequestClose} />
      <View style={styles.sheetContainer}>{children}</View>
    </Modal>
  );
}

const BACKDROP_RATIO = 0.3;

const styles = StyleSheet.create({
  backdrop: {
    flex: BACKDROP_RATIO,
    backgroundColor: 'transparent',
  },
  sheetContainer: {
    flex: 1 - BACKDROP_RATIO,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
});
