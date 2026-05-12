import type { User as SupabaseAuthUser } from '@supabase/supabase-js';

export type UserRole = 'parent' | 'staff' | 'school_admin' | 'super_admin';

export interface UserProfile {
  id: string;
  full_name: string;
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

export interface AuthStateSlice {
  session: AuthSession | null;
  isLoading: boolean;
  isRestoring: boolean;
}
