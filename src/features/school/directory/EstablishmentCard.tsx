import { memo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import type { EducationEstablishment } from './types';

interface Props {
  establishment: EducationEstablishment;
  actionLabel?: string;
  onPress?: () => void;
}

export const EstablishmentCard = memo(function EstablishmentCard({
  establishment,
  actionLabel,
  onPress,
}: Props) {
  const theme = useTheme();
  const { t } = useTranslation('school');
  const level =
    establishment.school_level === 'combined'
      ? t('directory_level_combined')
      : t(`directory_level_${establishment.school_level}`);
  const addressLines = [
    establishment.address_line_1,
    establishment.address_line_2,
    establishment.address_line_3,
  ]
    .map(line => line?.trim())
    .filter((line): line is string => Boolean(line))
    .filter(
      (line, index, lines) =>
        lines.findIndex(
          candidate => candidate.toLowerCase() === line.toLowerCase()
        ) === index
    );
  return (
    <View
      style={{
        backgroundColor: theme.card,
        borderWidth: 1,
        borderColor: theme.cardBorder,
        borderRadius: 18,
        padding: 16,
        gap: 8,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Ionicons name="checkmark-circle" size={18} color={theme.green} />
        <Text
          style={{
            color: theme.green,
            fontSize: 12,
            fontWeight: '800',
            flex: 1,
          }}
        >
          {t('directory_official_found')}
        </Text>
      </View>
      <Text style={{ color: theme.text, fontSize: 16, fontWeight: '800' }}>
        {establishment.official_name}
      </Text>
      <Text
        style={{ color: theme.textSecondary, fontSize: 13, lineHeight: 19 }}
      >
        {addressLines.join(', ')}
        {String.fromCharCode(10)}
        {establishment.postal_code} {establishment.city}
      </Text>
      <Text
        style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '700' }}
      >
        {level} · {t(`directory_sector_${establishment.sector}`)}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text style={{ color: theme.textMuted, fontSize: 12 }}>
          UAI {establishment.uai}
        </Text>
        <Text style={{ color: theme.primary, fontSize: 10, fontWeight: '800' }}>
          {t('directory_official_badge')}
        </Text>
      </View>
      {!establishment.is_active && (
        <Text style={{ color: theme.red, fontSize: 12, fontWeight: '700' }}>
          {t('directory_inactive')}
        </Text>
      )}
      {actionLabel && onPress && (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={onPress}
          disabled={!establishment.is_active}
          style={{
            minHeight: 48,
            borderRadius: 14,
            backgroundColor: establishment.is_active
              ? theme.primary
              : theme.iconBg,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: establishment.is_active ? 1 : 0.6,
          }}
        >
          <Text
            style={{
              color: establishment.is_active ? '#fff' : theme.textMuted,
              fontSize: 14,
              fontWeight: '800',
            }}
          >
            {actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
});
