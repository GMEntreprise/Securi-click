import type {
  Child,
  Guardian,
  ParentProfile,
  PickupLog,
} from '@/features/parent/types';
import type { HistoryEntry } from '@/features/parent/services/history.service';
import type { PickupAuthorization } from '@/features/parent/services/pickupAuthorization.service';
import type { QrCode } from '@/features/parent/services/qr.service';
import type {
  CollectorIdentityStatus,
  PickupValidation,
  SchoolChild,
  SchoolProfile,
} from '@/features/school/types';
import type { Notification } from '@/features/notifications/types';

export type DemoRole = 'parent' | 'collector' | 'establishment';

export type DemoGuardian = Guardian & {
  identity_status: CollectorIdentityStatus;
};

export interface DemoCollectorProfile {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  avatar_url: string | null;
  role: 'collector';
  created_at: string;
}

export interface DemoWorld {
  school: SchoolProfile;
  parentProfile: ParentProfile;
  collectorProfile: DemoCollectorProfile;
  children: SchoolChild[];
  guardians: DemoGuardian[];
  authorizations: PickupAuthorization[];
  validations: PickupValidation[];
  history: HistoryEntry[];
  pickupLogs: PickupLog[];
  qrCodes: QrCode[];
  notifications: Notification[];
}

export type DemoChild = Child;
