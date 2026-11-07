import type { NotificationType } from '../types';

export const NOTIFICATION_LABELS: Record<
  NotificationType,
  { titleKey: string; icon: string }
> = {
  child_picked_up: {
    titleKey: 'notifications:type_child_picked_up',
    icon: 'check-circle',
  },
  pickup_refused: {
    titleKey: 'notifications:type_pickup_refused',
    icon: 'x-circle',
  },
  qr_expired: { titleKey: 'notifications:type_qr_expired', icon: 'clock' },
  qr_invalid: {
    titleKey: 'notifications:type_qr_invalid',
    icon: 'alert-triangle',
  },
  qr_used: { titleKey: 'notifications:type_qr_used', icon: 'qr-code' },
  collector_activated: {
    titleKey: 'notifications:type_collector_activated',
    icon: 'user-check',
  },
  collector_deactivated: {
    titleKey: 'notifications:type_collector_deactivated',
    icon: 'user-x',
  },
  new_authorization: {
    titleKey: 'notifications:type_new_authorization',
    icon: 'shield',
  },
  identity_validated: {
    titleKey: 'notifications:type_identity_validated',
    icon: 'badge-check',
  },
  identity_refused: {
    titleKey: 'notifications:type_identity_refused',
    icon: 'badge-x',
  },
  account_created: {
    titleKey: 'notifications:type_account_created',
    icon: 'user-plus',
  },
  permissions_modified: {
    titleKey: 'notifications:type_permissions_modified',
    icon: 'settings',
  },
  security_incident: {
    titleKey: 'notifications:type_security_incident',
    icon: 'shield-alert',
  },
  new_parent_linked: {
    titleKey: 'notifications:type_new_parent_linked',
    icon: 'link',
  },
  school_validated: {
    titleKey: 'notifications:type_school_validated',
    icon: 'building-2',
  },
  access_suspended: {
    titleKey: 'notifications:type_access_suspended',
    icon: 'pause-circle',
  },
};

// Which roles receive each type
export const NOTIFICATION_TARGETS: Record<
  NotificationType,
  Array<'parent' | 'collector' | 'school_admin' | 'staff'>
> = {
  child_picked_up: ['parent'],
  pickup_refused: ['parent', 'collector'],
  qr_expired: ['parent', 'collector'],
  qr_invalid: ['school_admin', 'staff'],
  qr_used: ['parent'],
  collector_activated: ['parent', 'collector'],
  collector_deactivated: ['parent', 'collector'],
  new_authorization: ['collector'],
  identity_validated: ['collector'],
  identity_refused: ['collector'],
  account_created: ['parent', 'collector', 'school_admin'],
  permissions_modified: ['parent', 'collector', 'school_admin', 'staff'],
  security_incident: ['parent', 'school_admin', 'staff'],
  new_parent_linked: ['school_admin'],
  school_validated: ['school_admin'],
  access_suspended: ['parent', 'collector'],
};

// Route to navigate on tap
export const NOTIFICATION_ROUTES: Partial<Record<NotificationType, string>> = {
  child_picked_up: '/(parent-tabs)/history',
  pickup_refused: '/(parent-tabs)/history',
  qr_used: '/(parent-tabs)/history',
  collector_activated: '/(parent-tabs)/children',
  qr_invalid: '/(school-tabs)/history',
  security_incident: '/(school-tabs)/history',
  new_authorization: '/(collector-tabs)/access',
  identity_validated: '/(collector-tabs)/profile',
  identity_refused: '/(collector-tabs)/profile',
  permissions_modified: '/(collector-tabs)/access',
};
