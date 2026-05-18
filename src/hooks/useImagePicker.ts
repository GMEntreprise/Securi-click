import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase/client';

function randomId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
import { Toast } from '@/shared/ui/molecules/Toast';

type Bucket = 'profile-images' | 'children-images' | 'collector-avatars';

interface UseImagePickerOptions {
  bucket: Bucket;
  userId: string;
}

interface UploadResult {
  signedUrl: string;
  filePath: string;
}

export function useImagePicker({ bucket, userId }: UseImagePickerOptions) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pickFromGallery(): Promise<UploadResult | null> {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Permission d'accès à la galerie refusée.");
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

  async function takePhoto(): Promise<UploadResult | null> {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError("Permission d'accès à la caméra refusée.");
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
  ): Promise<UploadResult | null> {
    setIsUploading(true);
    setError(null);
    try {
      const uri = asset.uri;
      const ext = uri.split('.').pop()?.toLowerCase().split('?')[0] ?? 'jpg';
      const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
      const filePath = `${userId}/${randomId()}.${ext}`;

      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, arrayBuffer, {
          contentType,
          upsert: true,
          cacheControl: '3600',
        });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      return { signedUrl: data.publicUrl, filePath };
    } catch (e: any) {
      const msg = "Échec de l'envoi. Réessayez.";
      setError(msg);
      Toast.show(msg, { type: 'error', duration: 3000 });
      if (__DEV__) console.error('[useImagePicker] upload error:', e?.message ?? e);
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
