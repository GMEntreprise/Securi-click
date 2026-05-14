import type { NotificationType } from '../types';

export const NOTIFICATION_LABELS: Record<NotificationType, { title: string; icon: string }> = {
  child_picked_up:       { title: 'Enfant récupéré',            icon: 'check-circle' },
  pickup_refused:        { title: 'Récupération refusée',        icon: 'x-circle' },
  qr_expired:            { title: 'QR expiré',                   icon: 'clock' },
  qr_invalid:            { title: 'QR invalide',                 icon: 'alert-triangle' },
  qr_used:               { title: 'QR utilisé',                  icon: 'qr-code' },
  collector_activated:   { title: 'Collecteur activé',           icon: 'user-check' },
  collector_deactivated: { title: 'Collecteur désactivé',        icon: 'user-x' },
  new_authorization:     { title: 'Nouvelle autorisation',       icon: 'shield' },
  identity_validated:    { title: 'Identité validée',            icon: 'badge-check' },
  identity_refused:      { title: 'Identité refusée',            icon: 'badge-x' },
  account_created:       { title: 'Compte créé',                 icon: 'user-plus' },
  permissions_modified:  { title: 'Permissions modifiées',       icon: 'settings' },
  security_incident:     { title: 'Incident de sécurité',        icon: 'shield-alert' },
  new_parent_linked:     { title: 'Nouveau parent lié',          icon: 'link' },
  school_validated:      { title: 'Établissement validé',        icon: 'building-2' },
  access_suspended:      { title: 'Accès suspendu',              icon: 'pause-circle' },
};

// Which roles receive each type
export const NOTIFICATION_TARGETS: Record<NotificationType, Array<'parent' | 'collector' | 'school_admin' | 'staff'>> = {
  child_picked_up:       ['parent'],
  pickup_refused:        ['parent', 'collector'],
  qr_expired:            ['parent', 'collector'],
  qr_invalid:            ['school_admin', 'staff'],
  qr_used:               ['parent'],
  collector_activated:   ['parent', 'collector'],
  collector_deactivated: ['parent', 'collector'],
  new_authorization:     ['collector'],
  identity_validated:    ['collector'],
  identity_refused:      ['collector'],
  account_created:       ['parent', 'collector', 'school_admin'],
  permissions_modified:  ['parent', 'collector', 'school_admin', 'staff'],
  security_incident:     ['parent', 'school_admin', 'staff'],
  new_parent_linked:     ['school_admin'],
  school_validated:      ['school_admin'],
  access_suspended:      ['parent', 'collector'],
};

// Route to navigate on tap
export const NOTIFICATION_ROUTES: Partial<Record<NotificationType, string>> = {
  child_picked_up:    '/(parent-tabs)/history',
  pickup_refused:     '/(parent-tabs)/history',
  qr_used:            '/(parent-tabs)/history',
  collector_activated:'/(parent-tabs)/children',
  qr_invalid:         '/(school-tabs)/history',
  security_incident:  '/(school-tabs)/history',
  new_authorization:  '/(collector-tabs)/access',
  identity_validated: '/(collector-tabs)/profile',
  identity_refused:   '/(collector-tabs)/profile',
  permissions_modified: '/(collector-tabs)/access',
};
