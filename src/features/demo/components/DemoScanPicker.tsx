import React from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { DEMO_QR_SCENARIOS } from '../domain/qrScenarios';

interface Props {
  visible: boolean;
  onPick: (payload: string) => void;
  onClose: () => void;
}

export function DemoScanPicker({ visible, onPick, onClose }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('demo');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.45)',
          justifyContent: 'flex-end',
        }}
      >
        <View
          style={{
            backgroundColor: theme.bg,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 20,
            paddingBottom: insets.bottom + 20,
            maxHeight: '80%',
          }}
        >
          <Text
            accessibilityRole="header"
            style={{ color: theme.text, fontSize: 20, fontWeight: '800' }}
          >
            {t('scanner_demo_title')}
          </Text>
          <Text
            style={{
              color: theme.textSecondary,
              fontSize: 14,
              marginTop: 4,
              marginBottom: 14,
            }}
          >
            {t('scanner_demo_hint')}
          </Text>
          <ScrollView contentContainerStyle={{ gap: 10 }}>
            {DEMO_QR_SCENARIOS.map(scenario => {
              const ok = scenario.expected === 'validated';
              return (
                <Pressable
                  key={scenario.id}
                  onPress={() => onPick(scenario.payload)}
                  accessibilityRole="button"
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    minHeight: 56,
                    paddingHorizontal: 14,
                    borderRadius: 14,
                    backgroundColor: theme.card,
                    borderWidth: 1,
                    borderColor: theme.cardBorder,
                  }}
                >
                  <Text
                    style={{
                      color: theme.textMuted,
                      fontSize: 13,
                      fontWeight: '800',
                      width: 42,
                    }}
                  >
                    QR {scenario.number}
                  </Text>
                  <Text
                    style={{
                      flex: 1,
                      color: theme.text,
                      fontSize: 15,
                      fontWeight: '600',
                    }}
                  >
                    {t(scenario.labelKey)}
                  </Text>
                  <Ionicons
                    name={
                      ok ? 'checkmark-circle-outline' : 'close-circle-outline'
                    }
                    size={22}
                    color={ok ? theme.green : theme.red}
                  />
                </Pressable>
              );
            })}
          </ScrollView>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 48,
              marginTop: 10,
            }}
          >
            <Text
              style={{
                color: theme.textSecondary,
                fontSize: 15,
                fontWeight: '700',
              }}
            >
              {t('scanner_demo_close')}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
