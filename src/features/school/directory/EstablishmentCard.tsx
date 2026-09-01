import { memo, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { formatEstablishmentAddress } from './formatEstablishmentAddress';
import type { EducationEstablishment } from './types';

interface Props {
  establishment: EducationEstablishment;
  onPress?: () => void;
  highlight?: boolean;
  unavailableReason?: string | null;
}

export const EstablishmentCard = memo(function EstablishmentCard({
  establishment,
  onPress,
  highlight = false,
  unavailableReason = null,
}: Props) {
  const theme = useTheme();
  const { t } = useTranslation('school');
  const address = useMemo(
    () => formatEstablishmentAddress(establishment),
    [establishment]
  );
  const chips = [
    t(`directory_level_${establishment.school_level}`),
    t(`directory_sector_${establishment.sector}`),
  ];

  const body = (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.cardBorder },
      ]}
    >
      {highlight && (
        <View style={styles.badgeRow}>
          <Ionicons name="checkmark-circle" size={16} color={theme.green} />
          <Text style={[styles.badgeText, { color: theme.green }]}>
            {t('directory_official_found')}
          </Text>
        </View>
      )}

      <Text style={[styles.name, { color: theme.text }]} numberOfLines={3}>
        {establishment.official_name}
      </Text>

      {address.street.length > 0 && (
        <Text style={[styles.address, { color: theme.textSecondary }]}>
          {address.street}
        </Text>
      )}
      <Text style={[styles.address, { color: theme.textSecondary }]}>
        {address.locality}
      </Text>

      <View style={styles.chipRow}>
        {chips.map(chip => (
          <View
            key={chip}
            style={[styles.chip, { backgroundColor: theme.iconBg }]}
          >
            <Text style={[styles.chipText, { color: theme.textSecondary }]}>
              {chip}
            </Text>
          </View>
        ))}
      </View>

      <View style={[styles.footer, { borderTopColor: theme.cardBorder }]}>
        <Text style={[styles.uai, { color: theme.textMuted }]}>
          UAI {establishment.uai}
        </Text>
        <View style={styles.sourceRow}>
          <Ionicons name="shield-checkmark" size={12} color={theme.primary} />
          <Text style={[styles.sourceText, { color: theme.primary }]}>
            {t('directory_official_badge')}
          </Text>
        </View>
      </View>

      {!establishment.is_active && (
        <Text style={[styles.warning, { color: theme.red }]}>
          {t('directory_inactive')}
        </Text>
      )}
      {unavailableReason && (
        <Text style={[styles.warning, { color: theme.red }]}>
          {unavailableReason}
        </Text>
      )}
    </View>
  );

  if (!onPress) return body;
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={establishment.official_name}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {body}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 6 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badgeText: { fontSize: 12, fontWeight: '800', flex: 1 },
  name: { fontSize: 16, fontWeight: '800', lineHeight: 22 },
  address: { fontSize: 13, lineHeight: 19 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9 },
  chipText: { fontSize: 11, fontWeight: '700' },
  footer: { borderTopWidth: 1, paddingTop: 10, marginTop: 6, gap: 4 },
  uai: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sourceText: { fontSize: 11, fontWeight: '700', flex: 1 },
  warning: { fontSize: 12, fontWeight: '600', lineHeight: 18, marginTop: 4 },
});
