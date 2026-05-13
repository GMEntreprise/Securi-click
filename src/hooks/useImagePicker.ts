import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase/client';

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
      base64: true,
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
      base64: true,
    });
    if (result.canceled || !result.assets[0]) return null;
    return uploadAsset(result.assets[0]);
  }

  async function uploadAsset(
    asset: ImagePicker.ImagePickerAsset
  ): Promise<UploadResult | null> {
    if (!asset.base64) {
      setError("Impossible de lire l'image.");
      return null;
    }
    setIsUploading(true);
    setError(null);
    try {
      const binaryStr = atob(asset.base64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const arrayBuffer = bytes.buffer;
      const ext = asset.uri.split('.').pop()?.toLowerCase() ?? 'jpg';
      const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
      const filePath = `${userId}/${uuidv4()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, arrayBuffer, {
          contentType,
          upsert: true,
          cacheControl: '3600',
        });
      if (uploadError) throw uploadError;

      const { data: signedData, error: signedError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, 60 * 60 * 24 * 7);
      if (signedError) throw signedError;

      return { signedUrl: signedData.signedUrl, filePath };
    } catch {
      setError("Échec de l'envoi. Réessayez.");
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
