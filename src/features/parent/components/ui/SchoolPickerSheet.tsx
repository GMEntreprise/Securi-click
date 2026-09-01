import { memo, useCallback, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { SheetModal } from '@/shared/ui/molecules/SheetModal';
import {
  EstablishmentSelector,
  directoryService,
  type EducationEstablishment,
} from '@/features/school/directory';
import type { SchoolSearchResult } from '@/features/school/services/schoolSearch.service';

interface Props {
  visible: boolean;
  onSelect: (school: SchoolSearchResult) => void;
  onClose: () => void;
}

export const SchoolPickerSheet = memo(function SchoolPickerSheet({
  visible,
  onSelect,
  onClose,
}: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('school');
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = useCallback(
    async (establishment: EducationEstablishment) => {
      setIsResolving(true);
      setError(null);
      try {
        const schoolId = await directoryService.resolveSchoolId(
          establishment.id
        );
        if (!schoolId) {
          setError(t('directory_not_on_securiclick'));
          return;
        }
        onSelect({
          id: schoolId,
          name: establishment.official_name,
          normalized_name: establishment.official_name.toLowerCase(),
          type: establishment.nature_label,
          address: establishment.address_line_1 ?? establishment.city,
          city: establishment.city,
          postal_code: establishment.postal_code,
          logo_url: null,
          is_active: establishment.is_active,
          verified: true,
          external_id: establishment.uai,
          confidence: 100,
        });
      } catch {
        setError(t('directory_network_retry'));
      } finally {
        setIsResolving(false);
      }
    },
    [onSelect, t]
  );

  return (
    <SheetModal visible={visible} onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: theme.bg,
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: insets.bottom + 20,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 18,
          }}
        >
          <Text style={{ color: theme.text, fontSize: 21, fontWeight: '800' }}>
            {t('directory_title')}
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={t('directory_close')}
            onPress={onClose}
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              backgroundColor: theme.iconBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="close" size={20} color={theme.textMuted} />
          </TouchableOpacity>
        </View>
        <EstablishmentSelector
          purpose="parent-link"
          onConfirm={handleConfirm}
        />
        {isResolving && (
          <ActivityIndicator color={theme.primary} style={{ marginTop: 16 }} />
        )}
        {error && (
          <Text
            style={{
              color: theme.red,
              fontSize: 13,
              lineHeight: 19,
              marginTop: 12,
            }}
          >
            {error}
          </Text>
        )}
      </View>
    </SheetModal>
  );
});
