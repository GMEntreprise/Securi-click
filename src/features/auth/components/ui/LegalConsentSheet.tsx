import { useTheme } from '@/theme';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import React, { memo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

interface LegalConsentSheetProps {
  visible: boolean;
  onAccept: () => void;
  onClose: () => void;
  onOpenLegal: () => void;
  onOpenPrivacy: () => void;
  role: 'parent' | 'school';
}

export const LegalConsentSheet = memo(function LegalConsentSheet({
  visible,
  onAccept,
  onClose,
  onOpenLegal,
  onOpenPrivacy,
  role,
}: LegalConsentSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t: i18n } = useTranslation('auth');
  const [checkedTerms, setCheckedTerms] = useState(false);
  const [checkedPrivacy, setCheckedPrivacy] = useState(false);

  const canContinue = checkedTerms && checkedPrivacy;

  const handleAccept = () => {
    if (!canContinue) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onAccept();
  };

  const toggle = (which: 'terms' | 'privacy') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (which === 'terms') setCheckedTerms(v => !v);
    else setCheckedPrivacy(v => !v);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
        activeOpacity={1}
        onPress={onClose}
      />
      <Animated.View
        entering={FadeInUp.duration(280)}
        style={{
          backgroundColor: theme.card,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          maxHeight: '85%',
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
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 4,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 11,
                backgroundColor: theme.primaryBg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons
                name="shield-checkmark"
                size={18}
                color={theme.primary}
              />
            </View>
            <Text
              style={{ fontSize: 18, fontWeight: '800', color: theme.text }}
            >
              {i18n('legal_title')}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              backgroundColor: theme.iconBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="close" size={16} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 16,
            gap: 12,
          }}
        >
          {/* Summary card */}
          <Animated.View
            entering={FadeInDown.delay(60).duration(250)}
            style={{
              backgroundColor: theme.bg,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: theme.cardBorder,
              padding: 16,
              gap: 10,
            }}
          >
            <SummaryPoint
              color={theme.primary}
              bg={theme.primaryBg}
              text={
                role === 'school'
                  ? i18n('legal_school_summary')
                  : i18n('legal_parent_summary')
              }
            />
            <SummaryPoint
              color={theme.accent}
              bg={theme.accentBg}
              text={i18n('legal_data_summary')}
            />
            <SummaryPoint
              color={theme.green}
              bg={theme.greenBg}
              text={i18n('legal_gdpr_summary')}
            />
            <SummaryPoint
              color={theme.textMuted}
              bg={theme.iconBg}
              text={i18n('legal_contact_summary')}
            />
          </Animated.View>

          {/* Document links */}
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
                onOpenLegal();
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
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  backgroundColor: theme.iconBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name="document-text-outline"
                  size={16}
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
                {i18n('legal_mentions')}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={theme.textMuted}
              />
            </TouchableOpacity>

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
              }}
            >
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  backgroundColor: theme.iconBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={16}
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
                {i18n('legal_privacy')}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={theme.textMuted}
              />
            </TouchableOpacity>
          </Animated.View>

          {/* Checkboxes */}
          <Animated.View
            entering={FadeInDown.delay(140).duration(250)}
            style={{ gap: 10, paddingBottom: 4 }}
          >
            <ConsentRow
              checked={checkedTerms}
              onPress={() => toggle('terms')}
              label={
                <Text
                  style={{
                    fontSize: 13,
                    color: theme.textSecondary,
                    lineHeight: 18,
                    flex: 1,
                  }}
                >
                  {i18n('terms_accept_pre')}{' '}
                  <Text style={{ color: theme.primary, fontWeight: '700' }}>
                    {i18n('terms_accept_link')}
                  </Text>
                  {i18n('terms_accept_post')}
                </Text>
              }
              accentColor={theme.primary}
              accentBg={theme.primaryBg}
            />
            <ConsentRow
              checked={checkedPrivacy}
              onPress={() => toggle('privacy')}
              label={
                <Text
                  style={{
                    fontSize: 13,
                    color: theme.textSecondary,
                    lineHeight: 18,
                    flex: 1,
                  }}
                >
                  {i18n('privacy_accept_pre')}{' '}
                  <Text style={{ color: theme.primary, fontWeight: '700' }}>
                    {i18n('privacy_accept_link')}
                  </Text>
                  {i18n('privacy_accept_post')}
                </Text>
              }
              accentColor={theme.primary}
              accentBg={theme.primaryBg}
            />
          </Animated.View>

          {/* CTA */}
          <Animated.View
            entering={FadeInDown.delay(180).duration(250)}
            style={{ paddingBottom: 8 }}
          >
            <TouchableOpacity
              onPress={handleAccept}
              disabled={!canContinue}
              style={{
                backgroundColor: canContinue ? theme.primary : theme.iconBg,
                borderRadius: 18,
                paddingVertical: 16,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
              }}
            >
              <Text
                style={{
                  color: canContinue ? '#fff' : theme.textMuted,
                  fontWeight: '700',
                  fontSize: 15,
                }}
              >
                {i18n('continue')}
              </Text>
              {canContinue && (
                <Ionicons name="checkmark" size={16} color="#fff" />
              )}
            </TouchableOpacity>
            {!canContinue && (
              <Text
                style={{
                  color: theme.textMuted,
                  fontSize: 12,
                  textAlign: 'center',
                  marginTop: 8,
                }}
              >
                {i18n('check_both')}
              </Text>
            )}
          </Animated.View>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
});

function SummaryPoint({
  color,
  bg,
  text,
}: {
  color: string;
  bg: string;
  text: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 7,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 1,
          flexShrink: 0,
        }}
      >
        <Ionicons name="checkmark" size={11} color={color} />
      </View>
      <Text
        style={{
          fontSize: 13,
          color: '#666',
          lineHeight: 18,
          flex: 1,
        }}
      >
        {text}
      </Text>
    </View>
  );
}

function ConsentRow({
  checked,
  onPress,
  label,
  accentColor,
  accentBg,
}: {
  checked: boolean;
  onPress: () => void;
  label: React.ReactNode;
  accentColor: string;
  accentBg: string;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        backgroundColor: checked ? accentBg : theme.bg,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: checked ? accentColor : theme.inputBorder,
        padding: 12,
      }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 7,
          borderWidth: 2,
          borderColor: checked ? accentColor : theme.inputBorder,
          backgroundColor: checked ? accentColor : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 1,
          flexShrink: 0,
        }}
      >
        {checked && <Ionicons name="checkmark" size={12} color="#fff" />}
      </View>
      {label}
    </Pressable>
  );
}
