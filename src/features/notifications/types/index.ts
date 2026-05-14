import type { UserRole } from '@/features/auth/types';

export type NotificationType =
  | 'child_picked_up'
  | 'pickup_refused'
  | 'qr_expired'
  | 'qr_invalid'
  | 'collector_activated'
  | 'collector_deactivated'
  | 'new_authorization'
  | 'identity_validated'
  | 'identity_refused'
  | 'account_created'
  | 'permissions_modified'
  | 'security_incident'
  | 'new_parent_linked'
  | 'school_validated'
  | 'qr_used'
  | 'access_suspended';

export interface NotificationMetadata {
  child_id?: string;
  child_name?: string;
  collector_id?: string;
  collector_name?: string;
  guardian_id?: string;
  history_id?: string;
  school_id?: string;
  qr_id?: string;
  validation_id?: string;
  route?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  role: UserRole;
  type: NotificationType;
  title: string;
  body: string;
  metadata: NotificationMetadata;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  expires_at: string | null;
}

export interface NotificationGroup {
  date: string;
  items: Notification[];
}

export type DeliveryState = 'pending' | 'delivered' | 'failed';
