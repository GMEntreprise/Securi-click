import { useTheme } from '@/theme';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

interface WelcomeComplianceSheetProps {
  visible: boolean;
  onContinue: () => void;
  onOpenPrivacy: () => void;
  onOpenLegal: () => void;
}

export const WelcomeComplianceSheet = memo(function WelcomeComplianceSheet({
  visible,
  onContinue,
  onOpenPrivacy,
  onOpenLegal,
}: WelcomeComplianceSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('auth');

  const handleContinue = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onContinue();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleContinue}
    >
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.45)',
          }}
        />

        <Animated.View
          entering={FadeInUp.duration(320)}
          style={{
            backgroundColor: theme.card,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            maxHeight: '82%',
            paddingBottom: insets.bottom + 8,
          }}
        >
          {/* Handle */}
          <View style={{ alignItems: 'center', paddingTop: 12 }}>
            <View
              style={{
                width: 40,
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
              gap: 12,
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: 4,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 13,
                backgroundColor: theme.primaryBg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons
                name="shield-checkmark"
                size={20}
                color={theme.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 18, fontWeight: '800', color: theme.text }}
              >
                {t('welcome_title')}
              </Text>
              <Text
                style={{ fontSize: 13, color: theme.textMuted, marginTop: 2 }}
              >
                {t('welcome_subtitle')}
              </Text>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 16,
              gap: 10,
            }}
          >
            {/* Points */}
            <Animated.View
              entering={FadeInDown.delay(60).duration(250)}
              style={{
                backgroundColor: theme.bg,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: theme.cardBorder,
                padding: 16,
                gap: 12,
              }}
            >
              <InfoRow
                icon="lock-closed"
                iconColor={theme.primary}
                iconBg={theme.primaryBg}
                title={t('welcome_data_title')}
                body={t('welcome_data_body')}
              />
              <Separator color={theme.separator} />
              <InfoRow
                icon="people-outline"
                iconColor={theme.accent}
                iconBg={theme.accentBg}
                title={t('welcome_children_title')}
                body={t('welcome_children_body')}
              />
              <Separator color={theme.separator} />
              <InfoRow
                icon="notifications-outline"
                iconColor={theme.green}
                iconBg={theme.greenBg}
                title={t('welcome_notif_title')}
                body={t('welcome_notif_body')}
              />
              <Separator color={theme.separator} />
              <InfoRow
                icon="trash-outline"
                iconColor={theme.red}
                iconBg={theme.redBg}
                title={t('welcome_delete_title')}
                body={t('welcome_delete_body')}
              />
              <Separator color={theme.separator} />
              <InfoRow
                icon="document-text-outline"
                iconColor={theme.textMuted}
                iconBg={theme.iconBg}
                title={t('welcome_rgpd_title')}
                body={t('welcome_rgpd_body')}
              />
            </Animated.View>

            {/* Links */}
            <Animated.View
              entering={FadeInDown.delay(100).duration(250)}
              style={{
                backgroundColor: theme.bg,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: theme.cardBorder,
                overflow: 'hidden',
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onOpenPrivacy();
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 14,
                  gap: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.separator,
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    backgroundColor: theme.iconBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={15}
                    color={theme.textMuted}
                  />
                </View>
                <Text
                  style={{
                    flex: 1,
                    color: theme.text,
                    fontSize: 14,
                    fontWeight: '600',
                  }}
                >
                  Politique de confidentialité
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={15}
                  color={theme.textMuted}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onOpenLegal();
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 14,
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    backgroundColor: theme.iconBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons
                    name="document-text-outline"
                    size={15}
                    color={theme.textMuted}
                  />
                </View>
                <Text
                  style={{
                    flex: 1,
                    color: theme.text,
                    fontSize: 14,
                    fontWeight: '600',
                  }}
                >
                  Mentions légales
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={15}
                  color={theme.textMuted}
                />
              </TouchableOpacity>
            </Animated.View>

            {/* CTA */}
            <Animated.View
              entering={FadeInDown.delay(140).duration(250)}
              style={{ paddingBottom: 8 }}
            >
              <TouchableOpacity
                onPress={handleContinue}
                style={{
                  backgroundColor: theme.primary,
                  borderRadius: 18,
                  paddingVertical: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 8,
                }}
              >
                <Text
                  style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}
                >
                  {t('welcome_cta')}
                </Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
});

function InfoRow({
  icon,
  iconColor,
  iconBg,
  title,
  body,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  iconBg: string;
  title: string;
  body: string;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 11,
          backgroundColor: iconBg,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        <Ionicons name={icon} size={16} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 13,
            fontWeight: '700',
            color: '#444',
            marginBottom: 2,
          }}
        >
          {title}
        </Text>
        <Text style={{ fontSize: 12, color: '#888', lineHeight: 17 }}>
          {body}
        </Text>
      </View>
    </View>
  );
}

function Separator({ color }: { color: string }) {
  return (
    <View style={{ height: 1, backgroundColor: color, marginHorizontal: 4 }} />
  );
}
