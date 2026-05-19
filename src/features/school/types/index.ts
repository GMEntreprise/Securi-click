export interface SchoolProfile {
  id: string;
  name: string;
  type: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  manager_first_name: string;
  manager_last_name: string;
  manager_function: string;
  admin_user_id: string;
  logo_url: string | null;
  opening_hours: OpeningHours | null;
  slug: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OpeningHours {
  monday?: { open: string; close: string } | null;
  tuesday?: { open: string; close: string } | null;
  wednesday?: { open: string; close: string } | null;
  thursday?: { open: string; close: string } | null;
  friday?: { open: string; close: string } | null;
}

export interface SchoolChild {
  id: string;
  parent_id: string;
  school_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  photo_url: string | null;
  class_name: string | null;
  medical_notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  parent?: {
    first_name: string;
    last_name: string;
    phone: string | null;
  } | null;
}

export type ValidationStatus = 'validated' | 'refused' | 'pending';

export interface PickupValidation {
  id: string;
  school_id: string;
  child_id: string;
  guardian_id: string | null;
  qr_code_id: string | null;
  scanner_user_id: string | null;
  status: ValidationStatus;
  refusal_reason: string | null;
  scanned_at: string;
  meta: Record<string, unknown> | null;
  created_at: string;
  child?: {
    id: string;
    first_name: string;
    last_name: string;
    photo_url: string | null;
    class_name: string | null;
  } | null;
  guardian?: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    photo_url: string | null;
    relationship: string;
    identity_status?: CollectorIdentityStatus;
  } | null;
}

export type CollectorIdentityStatus = 'none' | 'pending' | 'verified' | 'refused' | 'expired';

export interface QrScanResult {
  success: boolean;
  refusal_reason?: string;
  validation_id?: string;
  log_id?: string;
  scanned_at?: string;
  child?: {
    id: string;
    first_name: string;
    last_name: string;
    photo_url: string | null;
    class_name: string | null;
  };
  guardian?: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    photo_url: string | null;
    relationship: string;
    identity_status?: CollectorIdentityStatus;
  } | null;
}

export type SchoolType =
  | 'École maternelle privée'
  | 'École maternelle publique'
  | 'École primaire privée'
  | 'École primaire publique';

export interface UpdateSchoolPayload {
  name?: string;
  type?: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  manager_first_name?: string;
  manager_last_name?: string;
  manager_function?: string;
  opening_hours?: OpeningHours | null;
}

export interface DashboardStats {
  todayValidations: number;
  todayRefusals: number;
  enrolledCount: number;
  recentValidations: PickupValidation[];
}
