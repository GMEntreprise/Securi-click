export type IdentityStatus =
  | 'none'
  | 'pending'
  | 'verified'
  | 'refused'
  | 'expired';
export type DocumentType = 'id_card' | 'passport' | 'driving_license';
export type VerificationStatus = 'pending' | 'verified' | 'refused' | 'expired';

export interface CollectorGuardian {
  id: string;
  parent_id: string;
  child_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  relationship: string;
  photo_url: string | null;
  priority: number;
  is_active: boolean;
  identity_status: IdentityStatus;
  identity_verified: boolean;
  collector_user_id: string | null;
  created_at: string;
  updated_at: string;
  child?: {
    id: string;
    first_name: string;
    last_name: string;
    photo_url: string | null;
    class_name: string | null;
    medical_notes: string | null;
    school?: { id: string; name: string; city: string } | null;
  } | null;
}

export interface CollectorIdentity {
  id: string;
  collector_user_id: string;
  parent_id: string;
  document_type: DocumentType;
  front_path: string | null;
  back_path: string | null;
  selfie_path: string | null;
  verification_status: VerificationStatus;
  verified_at: string | null;
  verified_by: string | null;
  refusal_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface CollectorPickupLog {
  id: string;
  child_id: string;
  guardian_id: string | null;
  pickup_time: string;
  status: 'completed' | 'denied' | 'cancelled';
  denial_reason: string | null;
  child?: {
    first_name: string;
    last_name: string;
    photo_url: string | null;
  } | null;
}

export interface UploadIdentityPayload {
  parentId: string;
  documentType: DocumentType;
  frontUri: string | null;
  backUri: string | null;
  selfieUri: string | null;
}
