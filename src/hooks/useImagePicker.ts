import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import {
  imageUploadService,
  type ImageBucket,
  type UploadedImage,
} from '@/shared/storage/imageUpload';
import { Toast } from '@/shared/ui/molecules/Toast';

interface UseImagePickerOptions {
  bucket: ImageBucket;
  userId: string;
}

export function useImagePicker({ bucket, userId }: UseImagePickerOptions) {
  const { t } = useTranslation('common');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pickFromGallery(): Promise<UploadedImage | null> {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError(t('permission_library_denied'));
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return null;
    return uploadAsset(result.assets[0]);
  }

  async function takePhoto(): Promise<UploadedImage | null> {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError(t('permission_camera_denied'));
      return null;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return null;
    return uploadAsset(result.assets[0]);
  }

  async function uploadAsset(
    asset: ImagePicker.ImagePickerAsset
  ): Promise<UploadedImage | null> {
    setIsUploading(true);
    setError(null);
    try {
      return await imageUploadService.upload(bucket, userId, asset.uri);
    } catch (uploadError) {
      const msg = t('upload_failed');
      setError(msg);
      Toast.show(msg, { type: 'error', duration: 3000 });
      if (__DEV__)
        console.error(
          '[useImagePicker] upload error:',
          uploadError instanceof Error ? uploadError.message : uploadError
        );
      return null;
    } finally {
      setIsUploading(false);
    }
  }

  return {
    pickFromGallery,
    takePhoto,
    isUploading,
    error,
    clearError: () => setError(null),
  };
}
