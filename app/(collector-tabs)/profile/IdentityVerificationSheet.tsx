import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { SheetModal } from '@/shared/ui/molecules/SheetModal';
import {
  useUploadIdentity,
  useMyGuardians,
} from '@/features/collector/hooks/useCollector';
import type {
  CollectorIdentity,
  DocumentType,
} from '@/features/collector/types';

interface Props {
  visible: boolean;
  onClose: () => void;
  currentIdentity: CollectorIdentity | null | undefined;
}

const DOC_TYPES: { id: DocumentType; labelKey: string }[] = [
  { id: 'id_card', labelKey: 'doc_id_card' },
  { id: 'passport', labelKey: 'doc_passport' },
  { id: 'driving_license', labelKey: 'doc_driving_license' },
];

export default function IdentityVerificationSheet({
  visible,
  onClose,
  currentIdentity,
}: Props) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useTranslation('collector');
  const uploadIdentity = useUploadIdentity();
  const { data: guardians } = useMyGuardians();

  const [docType, setDocType] = useState<DocumentType>('id_card');
  const [frontUri, setFrontUri] = useState<string | null>(null);
  const [backUri, setBackUri] = useState<string | null>(null);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);

  const parentId = guardians?.[0]?.parent_id ?? '';

  const pickImage = useCallback(async (slot: 'front' | 'back' | 'selfie') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: slot === 'selfie' ? [1, 1] : [4, 3],
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      if (slot === 'front') setFrontUri(uri);
      else if (slot === 'back') setBackUri(uri);
      else setSelfieUri(uri);
    }
  }, []);

  const takePhoto = useCallback(
    async (slot: 'front' | 'back' | 'selfie') => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('identity_camera_denied_title'),
          t('identity_camera_denied_body')
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        allowsEditing: true,
        aspect: slot === 'selfie' ? [1, 1] : [4, 3],
      });
      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        if (slot === 'front') setFrontUri(uri);
        else if (slot === 'back') setBackUri(uri);
        else setSelfieUri(uri);
      }
    },
    [t]
  );

  const handleSubmit = useCallback(async () => {
    if (!frontUri) {
      Alert.alert(
        t('identity_front_required_title'),
        t('identity_front_required_body')
      );
      return;
    }
    if (!parentId) {
      Alert.alert(t('common:error'), t('identity_no_parent'));
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await uploadIdentity.mutateAsync({
      parentId,
      documentType: docType,
      frontUri,
      backUri,
      selfieUri,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  }, [
    frontUri,
    backUri,
    selfieUri,
    docType,
    parentId,
    uploadIdentity,
    onClose,
    t,
  ]);

  const statusConfig = {
    pending: {
      labelKey: 'identity_status_pending',
      color: '#f59e0b',
      iconName: 'warning-outline' as const,
    },
    verified: {
      labelKey: 'identity_badge_verified',
      color: '#10b981',
      iconName: 'checkmark-circle' as const,
    },
    refused: {
      labelKey: 'identity_badge_refused',
      color: '#ef4444',
      iconName: 'shield-outline' as const,
    },
    expired: {
      labelKey: 'identity_status_expired',
      color: '#ef4444',
      iconName: 'shield-outline' as const,
    },
  } as const;

  return (
    <SheetModal visible={visible} onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        {/* Handle */}
        <View
          style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}
        >
          <View
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: theme.cardBorder,
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
            paddingBottom: 14,
            borderBottomWidth: 1,
            borderBottomColor: theme.cardBorder,
          }}
        >
          <Text style={{ color: theme.text, fontSize: 18, fontWeight: '800' }}>
            {t('identity_title')}
          </Text>
          <TouchableOpacity
            onPress={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              backgroundColor: theme.iconBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="close" size={18} color={theme.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={{
            padding: 20,
            paddingBottom: insets.bottom + 40,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Current status */}
          {currentIdentity && (
            <Animated.View
              entering={FadeInDown.duration(300)}
              style={{ marginBottom: 20 }}
            >
              {(() => {
                const st = currentIdentity.verification_status;
                const cfg = statusConfig[st as keyof typeof statusConfig];
                if (!cfg) return null;
                return (
                  <View
                    style={{
                      backgroundColor: `${cfg.color}15`,
                      borderRadius: 14,
                      padding: 14,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <Ionicons name={cfg.iconName} size={18} color={cfg.color} />
                    <Text
                      style={{
                        color: cfg.color,
                        fontSize: 14,
                        fontWeight: '700',
                        flex: 1,
                      }}
                    >
                      {t(cfg.labelKey)}
                    </Text>
                  </View>
                );
              })()}
            </Animated.View>
          )}

          {/* Doc type selector */}
          <Animated.View
            entering={FadeInDown.delay(60).duration(300)}
            style={{ marginBottom: 20 }}
          >
            <Text
              style={{
                color: theme.textMuted,
                fontSize: 11,
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: 10,
              }}
            >
              {t('identity_doc_type')}
            </Text>
            <View style={{ gap: 8 }}>
              {DOC_TYPES.map(dt => (
                <TouchableOpacity
                  key={dt.id}
                  onPress={() => {
                    setDocType(dt.id);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    padding: 14,
                    borderRadius: 14,
                    backgroundColor:
                      docType === dt.id ? theme.accentBg : theme.card,
                    borderWidth: 1.5,
                    borderColor:
                      docType === dt.id ? theme.accent : theme.cardBorder,
                  }}
                >
                  <Ionicons
                    name="document-text-outline"
                    size={16}
                    color={docType === dt.id ? theme.accent : theme.textMuted}
                  />
                  <Text
                    style={{
                      color: docType === dt.id ? theme.accent : theme.text,
                      fontWeight: '700',
                      fontSize: 14,
                    }}
                  >
                    {t(dt.labelKey)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* Upload slots */}
          <Animated.View
            entering={FadeInDown.delay(120).duration(300)}
            style={{ gap: 16, marginBottom: 24 }}
          >
            <UploadSlot
              label={t('identity_front_required')}
              uri={frontUri}
              onGallery={() => pickImage('front')}
              onCamera={() => takePhoto('front')}
            />
            {docType !== 'passport' && (
              <UploadSlot
                label={t('identity_back')}
                uri={backUri}
                onGallery={() => pickImage('back')}
                onCamera={() => takePhoto('back')}
              />
            )}
            <UploadSlot
              label={t('identity_selfie')}
              uri={selfieUri}
              onGallery={() => pickImage('selfie')}
              onCamera={() => takePhoto('selfie')}
              isSquare
            />
          </Animated.View>

          {/* Security note */}
          <View
            style={{
              backgroundColor: theme.accentBg,
              borderRadius: 14,
              padding: 14,
              marginBottom: 20,
            }}
          >
            <Text
              style={{
                color: theme.accent,
                fontSize: 12,
                fontWeight: '600',
                lineHeight: 18,
              }}
            >
              {t('identity_storage_note')}
            </Text>
          </View>

          {/* Submit */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={uploadIdentity.isPending || !frontUri}
            style={{
              backgroundColor: theme.accent,
              borderRadius: 18,
              paddingVertical: 16,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
              opacity: uploadIdentity.isPending || !frontUri ? 0.6 : 1,
            }}
          >
            {uploadIdentity.isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
            )}
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
              {uploadIdentity.isPending
                ? t('identity_sending')
                : t('identity_submit_review')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SheetModal>
  );
}

function UploadSlot({
  label,
  uri,
  onGallery,
  onCamera,
  isSquare = false,
}: {
  label: string;
  uri: string | null;
  onGallery: () => void;
  onCamera: () => void;
  isSquare?: boolean;
}) {
  const theme = useTheme();
  const { t } = useTranslation('collector');
  const height = isSquare ? 140 : 110;

  return (
    <View>
      <Text
        style={{
          color: theme.textMuted,
          fontSize: 11,
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 8,
        }}
      >
        {label}
      </Text>
      {uri ? (
        <View style={{ borderRadius: 16, overflow: 'hidden', height }}>
          <Image
            source={{ uri }}
            style={{ width: '100%', height }}
            resizeMode="cover"
          />
          <TouchableOpacity
            onPress={onGallery}
            style={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              backgroundColor: 'rgba(0,0,0,0.6)',
              borderRadius: 10,
              paddingHorizontal: 10,
              paddingVertical: 6,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Ionicons name="camera-outline" size={13} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>
              {t('identity_change')}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity
            onPress={onGallery}
            style={{
              flex: 1,
              height,
              borderRadius: 16,
              backgroundColor: theme.card,
              borderWidth: 1.5,
              borderColor: theme.cardBorder,
              borderStyle: 'dashed',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Ionicons
              name="cloud-upload-outline"
              size={20}
              color={theme.textMuted}
            />
            <Text
              style={{
                color: theme.textMuted,
                fontSize: 12,
                fontWeight: '600',
              }}
            >
              {t('identity_gallery')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onCamera}
            style={{
              flex: 1,
              height,
              borderRadius: 16,
              backgroundColor: theme.accentBg,
              borderWidth: 1.5,
              borderColor: theme.accent,
              borderStyle: 'dashed',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Ionicons name="camera-outline" size={20} color={theme.accent} />
            <Text
              style={{ color: theme.accent, fontSize: 12, fontWeight: '600' }}
            >
              {t('identity_camera')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
