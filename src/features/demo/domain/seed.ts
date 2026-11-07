import type { PickupAuthorization } from '@/features/parent/services/pickupAuthorization.service';
import type { HistoryEntry } from '@/features/parent/services/history.service';
import type { PickupLog } from '@/features/parent/types';
import type { PickupValidation, SchoolChild } from '@/features/school/types';
import type { Notification } from '@/features/notifications/types';
import { i18n } from '@/i18n';
import { DEMO_USER_IDS } from '../session';
import type { DemoGuardian, DemoWorld } from './types';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export const DEMO_IDS = {
  school: 'demo-school-tilleuls',
  otherParent: 'demo-parent-other',
  emma: 'demo-child-emma',
  lucas: 'demo-child-lucas',
  lea: 'demo-child-lea',
  noe: 'demo-child-noe',
  ines: 'demo-child-ines',
  sophieEmma: 'demo-guardian-sophie-emma',
  sophieLucas: 'demo-guardian-sophie-lucas',
  thomasLucas: 'demo-guardian-thomas-lucas',
  julieEmma: 'demo-guardian-julie-emma',
  alex: 'demo-person-alex',
} as const;

export function demoUnauthorizedPerson() {
  return {
    id: DEMO_IDS.alex,
    first_name: 'Alex',
    last_name: 'Durand',
    phone: '01 99 00 00 04',
    relationship: i18n.t('demo:seed_rel_unauthorized'),
    identity_status: 'none' as const,
  };
}

export function createDemoWorld(now: Date): DemoWorld {
  const nowMs = now.getTime();
  const iso = (offsetMs: number) => new Date(nowMs + offsetMs).toISOString();
  const createdAt = iso(-90 * DAY);

  const child = (
    id: string,
    firstName: string,
    lastName: string,
    birthDate: string,
    className: string,
    parentId: string,
    parent: { first_name: string; last_name: string }
  ): SchoolChild => ({
    id,
    parent_id: parentId,
    school_id: DEMO_IDS.school,
    first_name: firstName,
    last_name: lastName,
    date_of_birth: birthDate,
    photo_url: null,
    class_name: className,
    medical_notes: null,
    is_active: true,
    created_at: createdAt,
    updated_at: createdAt,
    parent: { ...parent, phone: '01 99 00 00 00' },
  });

  const camille = { first_name: 'Camille', last_name: 'Martin' };
  const other = { first_name: 'Marie', last_name: 'Petit' };

  const guardian = (
    id: string,
    childId: string,
    firstName: string,
    lastName: string,
    relationship: string,
    phone: string,
    email: string,
    overrides: Partial<DemoGuardian> = {}
  ): DemoGuardian => ({
    id,
    parent_id: DEMO_USER_IDS.parent,
    child_id: childId,
    first_name: firstName,
    last_name: lastName,
    phone,
    email,
    relationship,
    photo_url: null,
    priority: 1,
    is_active: true,
    collector_user_id: null,
    access_code_hash: 'demo',
    identity_status: 'verified',
    created_at: createdAt,
    updated_at: createdAt,
    ...overrides,
  });

  const authorization = (
    guardianId: string,
    childId: string,
    expiresAt: string | null = null
  ): PickupAuthorization => ({
    id: `demo-authorization-${guardianId}`,
    parent_id: DEMO_USER_IDS.parent,
    child_id: childId,
    guardian_id: guardianId,
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    start_time: '16:00:00',
    end_time: '18:30:00',
    time_windows: [{ start: '16:00', end: '18:30' }],
    timezone: 'Europe/Paris',
    reminder_before: 15,
    is_active: true,
    expires_at: expiresAt,
    next_pickup_at: null,
    last_reminded_at: null,
    created_at: createdAt,
    updated_at: createdAt,
  });

  const children = [
    child(
      DEMO_IDS.emma,
      'Emma',
      'Martin',
      '2020-03-14',
      'CP',
      DEMO_USER_IDS.parent,
      camille
    ),
    child(
      DEMO_IDS.lucas,
      'Lucas',
      'Martin',
      '2017-09-02',
      'CE2',
      DEMO_USER_IDS.parent,
      camille
    ),
    child(
      DEMO_IDS.lea,
      'Léa',
      'Petit',
      '2020-06-21',
      'CP',
      DEMO_IDS.otherParent,
      other
    ),
    child(
      DEMO_IDS.noe,
      'Noé',
      'Petit',
      '2017-11-30',
      'CE2',
      DEMO_IDS.otherParent,
      other
    ),
    child(
      DEMO_IDS.ines,
      'Inès',
      'Moreau',
      '2020-01-09',
      'CP',
      DEMO_IDS.otherParent,
      {
        first_name: 'Paul',
        last_name: 'Moreau',
      }
    ),
  ];

  const guardians: DemoGuardian[] = [
    guardian(
      DEMO_IDS.sophieEmma,
      DEMO_IDS.emma,
      'Sophie',
      'Martin',
      i18n.t('demo:seed_rel_grandmother'),
      '01 99 00 00 01',
      'sophie.martin@demo.invalid',
      {
        collector_user_id: DEMO_USER_IDS.collector,
      }
    ),
    guardian(
      DEMO_IDS.sophieLucas,
      DEMO_IDS.lucas,
      'Sophie',
      'Martin',
      i18n.t('demo:seed_rel_grandmother'),
      '01 99 00 00 01',
      'sophie.martin@demo.invalid',
      {
        collector_user_id: DEMO_USER_IDS.collector,
        is_active: false,
      }
    ),
    guardian(
      DEMO_IDS.thomasLucas,
      DEMO_IDS.lucas,
      'Thomas',
      'Martin',
      i18n.t('demo:seed_rel_father'),
      '01 99 00 00 02',
      'thomas.martin@demo.invalid'
    ),
    guardian(
      DEMO_IDS.julieEmma,
      DEMO_IDS.emma,
      'Julie',
      'Bernard',
      i18n.t('demo:seed_rel_nanny'),
      '01 99 00 00 03',
      'julie.bernard@demo.invalid',
      {
        identity_status: 'pending',
      }
    ),
  ];

  const authorizations = [
    authorization(DEMO_IDS.sophieEmma, DEMO_IDS.emma),
    authorization(DEMO_IDS.thomasLucas, DEMO_IDS.lucas),
    authorization(DEMO_IDS.julieEmma, DEMO_IDS.emma, iso(7 * DAY)),
  ];

  const pastScans: {
    id: string;
    offset: number;
    childId: string;
    guardianId: string;
    status: 'validated' | 'refused';
    reason: string | null;
  }[] = [
    {
      id: '1',
      offset: -1 * HOUR,
      childId: DEMO_IDS.emma,
      guardianId: DEMO_IDS.sophieEmma,
      status: 'validated',
      reason: null,
    },
    {
      id: '2',
      offset: -1 * DAY,
      childId: DEMO_IDS.lucas,
      guardianId: DEMO_IDS.thomasLucas,
      status: 'validated',
      reason: null,
    },
    {
      id: '3',
      offset: -2 * DAY,
      childId: DEMO_IDS.emma,
      guardianId: DEMO_IDS.julieEmma,
      status: 'refused',
      reason: i18n.t('demo:seed_qr_expired'),
    },
    {
      id: '4',
      offset: -3 * DAY,
      childId: DEMO_IDS.emma,
      guardianId: DEMO_IDS.julieEmma,
      status: 'validated',
      reason: null,
    },
  ];

  const childById = new Map(children.map(item => [item.id, item]));
  const guardianById = new Map(guardians.map(item => [item.id, item]));

  const validations: PickupValidation[] = pastScans.map(scan => {
    const scanned = childById.get(scan.childId);
    const person = guardianById.get(scan.guardianId);
    return {
      id: `demo-validation-${scan.id}`,
      school_id: DEMO_IDS.school,
      child_id: scan.childId,
      guardian_id: scan.guardianId,
      qr_code_id: null,
      scanner_user_id: DEMO_USER_IDS.establishment,
      status: scan.status,
      refusal_reason: scan.reason,
      scanned_at: iso(scan.offset),
      meta: null,
      created_at: iso(scan.offset),
      child: scanned
        ? {
            id: scanned.id,
            first_name: scanned.first_name,
            last_name: scanned.last_name,
            photo_url: null,
            class_name: scanned.class_name,
            parent: camille,
          }
        : null,
      guardian: person
        ? {
            id: person.id,
            first_name: person.first_name,
            last_name: person.last_name,
            phone: person.phone ?? '',
            photo_url: null,
            relationship: person.relationship,
            identity_status: person.identity_status,
          }
        : null,
    };
  });

  const history: HistoryEntry[] = pastScans.map(scan => {
    const scanned = childById.get(scan.childId);
    const person = guardianById.get(scan.guardianId);
    return {
      id: `demo-history-${scan.id}`,
      child_id: scan.childId,
      collector_id: scan.guardianId,
      parent_id: DEMO_USER_IDS.parent,
      school_id: DEMO_IDS.school,
      staff_id: DEMO_USER_IDS.establishment,
      qr_jti: null,
      status: scan.status === 'validated' ? 'completed' : 'denied',
      scanned_at: iso(scan.offset),
      pickup_time: scan.status === 'validated' ? iso(scan.offset) : null,
      created_at: iso(scan.offset),
      denial_reason: scan.reason,
      is_pinned: false,
      is_archived: false,
      archived_at: null,
      child: scanned
        ? {
            first_name: scanned.first_name,
            last_name: scanned.last_name,
            photo_url: null,
          }
        : null,
      guardian: person
        ? {
            first_name: person.first_name,
            last_name: person.last_name,
            relationship: person.relationship,
            photo_url: null,
          }
        : null,
    };
  });

  const pickupLogs: PickupLog[] = pastScans.map(scan => {
    const scanned = childById.get(scan.childId);
    const person = guardianById.get(scan.guardianId);
    return {
      id: `demo-log-${scan.id}`,
      child_id: scan.childId,
      guardian_id: scan.guardianId,
      qr_code_id: null,
      staff_id: DEMO_USER_IDS.establishment,
      pickup_time: iso(scan.offset),
      status: scan.status === 'validated' ? 'completed' : 'denied',
      denial_reason: scan.reason,
      notes: null,
      created_at: iso(scan.offset),
      child: scanned
        ? {
            first_name: scanned.first_name,
            last_name: scanned.last_name,
            photo_url: null,
          }
        : undefined,
      guardian: person
        ? {
            first_name: person.first_name,
            last_name: person.last_name,
            relationship: person.relationship,
          }
        : undefined,
    };
  });

  const notification = (
    id: string,
    userId: string,
    role: Notification['role'],
    title: string,
    body: string
  ): Notification => ({
    id,
    user_id: userId,
    role,
    type: 'child_picked_up',
    title,
    body,
    metadata: {},
    is_read: false,
    read_at: null,
    created_at: iso(-1 * HOUR),
    expires_at: null,
  });

  return {
    school: {
      id: DEMO_IDS.school,
      name: 'École des Tilleuls',
      type: 'École primaire publique',
      email: 'contact@demo.invalid',
      phone: '01 99 00 00 10',
      address: '1 rue des Tilleuls',
      city: 'Exempleville',
      postal_code: '00000',
      manager_first_name: 'Claire',
      manager_last_name: 'Fontaine',
      manager_function: i18n.t('auth:manager_director'),
      admin_user_id: DEMO_USER_IDS.establishment,
      logo_url: null,
      opening_hours: null,
      slug: null,
      is_active: true,
      verified: true,
      external_id: null,
      education_establishment_id: null,
      education_link_status: 'not_applicable',
      created_at: createdAt,
      updated_at: createdAt,
    },
    parentProfile: {
      id: 'demo-profile-parent',
      user_id: DEMO_USER_IDS.parent,
      first_name: camille.first_name,
      last_name: camille.last_name,
      phone: '01 99 00 00 00',
      avatar_url: null,
      role: 'parent',
      school_id: null,
      created_at: createdAt,
      updated_at: createdAt,
    },
    collectorProfile: {
      id: 'demo-profile-collector',
      first_name: 'Sophie',
      last_name: 'Martin',
      phone: '01 99 00 00 01',
      avatar_url: null,
      role: 'collector',
      created_at: createdAt,
    },
    collectorIdentity: null,
    children,
    guardians,
    authorizations,
    validations,
    history,
    pickupLogs,
    qrCodes: [],
    usedQrTokens: [],
    notifications: [
      notification(
        'demo-notification-parent',
        DEMO_USER_IDS.parent,
        'parent',
        i18n.t('demo:seed_notif_parent_title'),
        i18n.t('demo:seed_notif_parent_body')
      ),
      notification(
        'demo-notification-collector',
        DEMO_USER_IDS.collector,
        'collector',
        i18n.t('demo:seed_notif_collector_title'),
        i18n.t('demo:seed_notif_collector_body')
      ),
      notification(
        'demo-notification-school',
        DEMO_USER_IDS.establishment,
        'school_admin',
        i18n.t('demo:seed_notif_school_title'),
        i18n.t('demo:seed_notif_school_body')
      ),
    ],
  };
}
