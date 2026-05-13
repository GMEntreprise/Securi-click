import React, { memo } from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '@/theme';

type Strength = 'weak' | 'medium' | 'strong';

const STRENGTH_CONFIG: Record<
  Strength,
  { label: string; color: string; bars: number }
> = {
  weak: { label: 'Faible', color: '#ef4444', bars: 1 },
  medium: { label: 'Moyen', color: '#f97316', bars: 2 },
  strong: { label: 'Fort', color: '#10b981', bars: 3 },
};

interface PasswordStrengthBarProps {
  strength: Strength;
}

export const PasswordStrengthBar: React.FC<PasswordStrengthBarProps> = memo(
  ({ strength }) => {
    const t = useTheme();
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
          Force du mot de passe :{' '}
          <Text style={{ fontWeight: '800', color: config.color }}>
            {config.label}
          </Text>
        </Text>
      </View>
    );
  }
);

PasswordStrengthBar.displayName = 'PasswordStrengthBar';
