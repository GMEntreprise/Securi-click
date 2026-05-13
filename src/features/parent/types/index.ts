export interface Child {
  id: string;
  parent_user_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  grade: string | null;
  school_id: string | null;
  school_name: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthorizedPerson {
  id: string;
  parent_user_id: string;
  child_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  relation: string;
  is_active: boolean;
  valid_until: string | null;
  photo_url: string | null;
  notes: string | null;
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
  authorized_person_id: string | null;
  collector_user_id: string | null;
  school_id: string | null;
  status: 'completed' | 'pending' | 'refused' | 'replay_attempt';
  scanned_at: string;
  notes: string | null;
  child?: Pick<Child, 'first_name' | 'last_name' | 'photo_url'>;
  authorized_person?: Pick<
    AuthorizedPerson,
    'first_name' | 'last_name' | 'relation'
  >;
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
  grade: string;
  school_name: string;
  photo_url?: string | null;
}

export interface AddAuthorizedPersonPayload {
  child_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  relation: string;
  valid_until: string | null;
  notes: string | null;
}

export interface UpdateAuthorizedPersonPayload {
  first_name: string;
  last_name: string;
  phone: string;
  relation: string;
  valid_until: string | null;
  notes: string | null;
}
