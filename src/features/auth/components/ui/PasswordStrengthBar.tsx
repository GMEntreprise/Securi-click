import React, { memo } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';

type Strength = 'weak' | 'medium' | 'strong';

const STRENGTH_CONFIG: Record<
  Strength,
  { labelKey: string; color: string; bars: number }
> = {
  weak: { labelKey: 'password_weak', color: '#ef4444', bars: 1 },
  medium: { labelKey: 'password_medium', color: '#f97316', bars: 2 },
  strong: { labelKey: 'password_strong', color: '#10b981', bars: 3 },
};

interface PasswordStrengthBarProps {
  strength: Strength;
}

export const PasswordStrengthBar: React.FC<PasswordStrengthBarProps> = memo(
  ({ strength }) => {
    const t = useTheme();
    const { t: i18n } = useTranslation('auth');
    const config = STRENGTH_CONFIG[strength];

    return (
      <View style={{ marginTop: 8, marginBottom: 4 }}>
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 4 }}>
          {[1, 2, 3].map(i => (
            <View
              key={i}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 4,
                backgroundColor:
                  i <= config.bars ? config.color : t.inputBorder,
              }}
            />
          ))}
        </View>
        <Text style={{ fontSize: 12, fontWeight: '600', color: config.color }}>
          {i18n('password_strength')}{' '}
          <Text style={{ fontWeight: '800', color: config.color }}>
            {i18n(config.labelKey)}
          </Text>
        </Text>
      </View>
    );
  }
);

PasswordStrengthBar.displayName = 'PasswordStrengthBar';
