import { memo, useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { SheetModal } from '@/shared/ui/molecules/SheetModal';
import { EstablishmentBrowser } from './EstablishmentBrowser';
import { EstablishmentCard } from './EstablishmentCard';
import {
  canConfirmEstablishment,
  type EstablishmentSelectionPurpose,
} from './selectionPolicy';
import type { EducationEstablishment } from './types';

interface Props {
  confirmed?: EducationEstablishment | null;
  purpose?: EstablishmentSelectionPurpose;
  onConfirm: (establishment: EducationEstablishment) => void;
  onModify?: () => void;
}

export const EstablishmentSelector = memo(function EstablishmentSelector({
  confirmed,
  purpose = 'claim',
  onConfirm,
  onModify,
}: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('school');
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [rejected, setRejected] = useState<string | null>(null);

  const open = useCallback(() => {
    setRejected(null);
    setIsBrowsing(true);
  }, []);
  const close = useCallback(() => setIsBrowsing(false), []);

  const handleSelect = useCallback(
    (establishment: EducationEstablishment) => {
      if (!canConfirmEstablishment(establishment, purpose)) {
        setRejected(
          !establishment.is_active
            ? t('directory_inactive')
            : purpose === 'claim'
              ? t('directory_already_claimed')
              : t('directory_not_on_securiclick')
        );
        return;
      }
      setRejected(null);
      setIsBrowsing(false);
      onConfirm(establishment);
    },
    [onConfirm, purpose, t]
  );

  const handleModify = useCallback(() => {
    onModify?.();
    open();
  }, [onModify, open]);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.textMuted }]}>
        {t('directory_field_label')}
      </Text>

      {confirmed ? (
        <View style={styles.selected}>
          <EstablishmentCard establishment={confirmed} highlight />
          <TouchableOpacity
            accessibilityRole="button"
            onPress={handleModify}
            style={styles.changeButton}
          >
            <Ionicons name="swap-horizontal" size={16} color={theme.primary} />
            <Text style={[styles.changeText, { color: theme.primary }]}>
              {t('directory_modify')}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t('directory_field_placeholder')}
          onPress={open}
          activeOpacity={0.75}
          style={[
            styles.field,
            { backgroundColor: theme.input, borderColor: theme.inputBorder },
          ]}
        >
          <View
            style={[styles.fieldIcon, { backgroundColor: theme.primaryBg }]}
          >
            <Ionicons name="school-outline" size={18} color={theme.primary} />
          </View>
          <View style={styles.fieldTexts}>
            <Text style={[styles.fieldTitle, { color: theme.text }]}>
              {t('directory_field_placeholder')}
            </Text>
            <Text style={[styles.fieldHint, { color: theme.textMuted }]}>
              {t('directory_subtitle')}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
        </TouchableOpacity>
      )}

      <SheetModal visible={isBrowsing} onRequestClose={close}>
        <View
          style={[
            styles.sheet,
            { backgroundColor: theme.bg, paddingBottom: insets.bottom + 12 },
          ]}
        >
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: theme.text }]}>
              {t('directory_title')}
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={t('directory_close')}
              onPress={close}
              style={[styles.closeButton, { backgroundColor: theme.iconBg }]}
            >
              <Ionicons name="close" size={20} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
          {rejected && (
            <Text style={[styles.rejected, { color: theme.red }]}>
              {rejected}
            </Text>
          )}
          <EstablishmentBrowser purpose={purpose} onSelect={handleSelect} />
        </View>
      </SheetModal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { gap: 8 },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  selected: { gap: 8 },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 48,
  },
  changeText: { fontSize: 14, fontWeight: '700' },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 68,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  fieldIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldTexts: { flex: 1, gap: 2 },
  fieldTitle: { fontSize: 15, fontWeight: '700' },
  fieldHint: { fontSize: 12, lineHeight: 16 },
  sheet: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  sheetTitle: { flex: 1, fontSize: 21, fontWeight: '800' },
  closeButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejected: { fontSize: 13, lineHeight: 19, marginBottom: 10 },
});
