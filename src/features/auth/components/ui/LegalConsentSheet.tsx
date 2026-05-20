import { useTheme } from '@/theme';
import * as Haptics from 'expo-haptics';
import {
  Check,
  ChevronRight,
  FileText,
  Lock,
  Shield,
  X,
} from 'lucide-react-native';
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
              <Shield size={18} color={theme.primary} strokeWidth={2} />
            </View>
            <Text
              style={{ fontSize: 18, fontWeight: '800', color: theme.text }}
            >
              Avant de continuer
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
            <X size={16} color={theme.textSecondary} />
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
                  ? "Votre compte établissement est destiné à la gestion sécurisée des récupérations d'élèves."
                  : 'Votre compte parent vous permet de gérer les récupérations de vos enfants en toute sécurité.'
              }
            />
            <SummaryPoint
              color={theme.accent}
              bg={theme.accentBg}
              text="Nous collectons uniquement les données nécessaires au fonctionnement du service (nom, email, téléphone)."
            />
            <SummaryPoint
              color={theme.green}
              bg={theme.greenBg}
              text="Vos données sont traitées conformément au RGPD. Vous pouvez les modifier ou les supprimer à tout moment."
            />
            <SummaryPoint
              color={theme.textMuted}
              bg={theme.iconBg}
              text="Contact : contact@securi-click.com — SARL Securi'ClickT, 1 Rue Louis Jourdan, 83000 Toulon."
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
                <FileText size={16} color={theme.textMuted} />
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
              <ChevronRight size={16} color={theme.textMuted} />
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
                <Lock size={16} color={theme.textMuted} />
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
              <ChevronRight size={16} color={theme.textMuted} />
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
                  J'accepte les{' '}
                  <Text style={{ color: theme.primary, fontWeight: '700' }}>
                    Conditions Générales d'Utilisation
                  </Text>{' '}
                  de Securi'Click.
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
                  J'ai pris connaissance de la{' '}
                  <Text style={{ color: theme.primary, fontWeight: '700' }}>
                    Politique de Confidentialité
                  </Text>{' '}
                  et j'accepte le traitement de mes données.
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
                Continuer
              </Text>
              {canContinue && (
                <Check size={16} color="#fff" strokeWidth={2.5} />
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
                Cochez les deux cases pour continuer
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
        <Check size={11} color={color} strokeWidth={3} />
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
        {checked && <Check size={12} color="#fff" strokeWidth={3} />}
      </View>
      {label}
    </Pressable>
  );
}
