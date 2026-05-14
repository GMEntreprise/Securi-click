import type { User as SupabaseAuthUser } from '@supabase/supabase-js';

export type UserRole =
  | 'parent'
  | 'collector'
  | 'staff'
  | 'school_admin'
  | 'super_admin';

export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  school_id?: string;
  role?: UserRole;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  authUser: SupabaseAuthUser;
  profile?: UserProfile | null;
}

export interface AuthSession {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export interface AuthState {
  session: AuthSession | null;
  isLoading: boolean;
  isRestoring: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterParentData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
  accept_terms: boolean;
  accept_privacy: boolean;
}

export interface RegisterSchoolData {
  school_name: string;
  school_type: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  manager_first_name: string;
  manager_last_name: string;
  manager_function: string;
  password: string;
  confirm_password: string;
  accept_terms: boolean;
  accept_privacy: boolean;
}

export interface InviteCollectorData {
  email: string;
}
