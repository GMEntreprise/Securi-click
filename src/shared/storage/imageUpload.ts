import { supabase } from '@/lib/supabase/client';
import { demoAware } from '@/features/demo/services/demoAware';
import { resolveStorageUrl } from './signedUrl';

export type ImageBucket =
  | 'profile-images'
  | 'children-images'
  | 'collector-avatars'
  | 'school-logos';

export interface UploadedImage {
  signedUrl: string;
  filePath: string;
}

export interface ImageUploadService {
  upload(
    bucket: ImageBucket,
    userId: string,
    uri: string
  ): Promise<UploadedImage>;
}

function randomId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const supabaseImageUploadService: ImageUploadService = {
  async upload(bucket, userId, uri) {
    const ext = uri.split('.').pop()?.toLowerCase().split('?')[0] ?? 'jpg';
    const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
    const filePath = `${userId}/${randomId()}.${ext}`;

    const response = await fetch(uri);
    const arrayBuffer = await response.arrayBuffer();

    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, arrayBuffer, {
        contentType,
        upsert: true,
        cacheControl: '3600',
      });
    if (error) throw error;

    const signedUrl = await resolveStorageUrl(bucket, filePath);
    if (!signedUrl) throw new Error('unresolved_upload');
    return { signedUrl, filePath };
  },
};

const demoImageUploadService: ImageUploadService = {
  async upload(_bucket, _userId, uri) {
    return { signedUrl: uri, filePath: uri };
  },
};

export const imageUploadService: ImageUploadService = demoAware(
  supabaseImageUploadService,
  demoImageUploadService
);
