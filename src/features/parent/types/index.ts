export interface Child {
  id: string;
  parent_id: string;
  school_id: string | null;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  photo_url: string | null;
  class_name: string | null;
  medical_notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Guardian {
  id: string;
  parent_id: string;
  child_id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  relationship: string;
  photo_url: string | null;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ParentProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  avatar_url: string | null;
  role: 'parent';
  school_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PickupLog {
  id: string;
  child_id: string;
  guardian_id: string | null;
  qr_code_id: string | null;
  staff_id: string | null;
  pickup_time: string;
  status: 'completed' | 'denied' | 'cancelled';
  denial_reason: string | null;
  notes: string | null;
  created_at: string;
  child?: Pick<Child, 'first_name' | 'last_name' | 'photo_url'>;
  guardian?: Pick<Guardian, 'first_name' | 'last_name' | 'relationship'>;
}

export interface UpdateProfilePayload {
  first_name: string;
  last_name: string;
  phone: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface AddChildPayload {
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  class_name: string;
  school_id?: string | null;
  photo_url?: string | null;
  medical_notes?: string | null;
}

export interface AddGuardianPayload {
  child_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string | null;
  relationship: string;
  photo_url?: string | null;
  priority?: number;
}

export interface UpdateGuardianPayload {
  first_name: string;
  last_name: string;
  phone?: string | null;
  email: string;
  relationship: string;
  priority?: number;
}
