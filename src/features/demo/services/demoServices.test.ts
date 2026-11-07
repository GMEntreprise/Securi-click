import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockRpc = jest.fn<(...args: unknown[]) => unknown>();
const mockFrom = jest.fn<(...args: unknown[]) => unknown>();
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: (...args: unknown[]) => mockFrom(...args),
    storage: { from: (...args: unknown[]) => mockFrom(...args) },
  },
}));

import { parentService } from '@/features/parent/services/parent.service';
import { qrService } from '@/features/parent/services/qr.service';
import { historyService } from '@/features/parent/services/history.service';
import { pickupAuthorizationService } from '@/features/parent/services/pickupAuthorization.service';
import { schoolService } from '@/features/school/services/school.service';
import { collectorService } from '@/features/collector/services/collector.service';
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllRead,
} from '@/features/notifications/api/notifications.api';
import { queryClient } from '@/lib/queryClient';
import { DEMO_QR_SCENARIOS } from '../domain/qrScenarios';
import { DEMO_IDS } from '../domain/seed';
import { DEMO_USER_IDS } from '../session';
import { useDemoStore } from '../store/demo.store';

const store = () => useDemoStore.getState();
const payloadOf = (id: string) =>
  DEMO_QR_SCENARIOS.find(scenario => scenario.id === id)?.payload ?? '';
const schoolId = () => store().world?.school.id ?? '';

describe('simulated services', () => {
  beforeEach(() => {
    store().exit();
    mockRpc.mockClear();
    mockFrom.mockClear();
    store().enter('parent');
  });

  it('serves the parent family without touching Supabase', async () => {
    const children = await parentService.getChildren(DEMO_USER_IDS.parent);
    expect(children.map(child => child.first_name).sort()).toEqual([
      'Emma',
      'Lucas',
    ]);
    const guardians = await parentService.getGuardians(DEMO_IDS.emma);
    expect(guardians.map(g => g.first_name)).toEqual(
      expect.arrayContaining(['Sophie', 'Julie'])
    );
    expect(mockFrom).not.toHaveBeenCalled();
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('adds a collector immediately, without invitation, once', async () => {
    const { error } = await parentService.inviteGuardian({
      p_child_id: DEMO_IDS.lucas,
      p_first_name: 'Nina',
      p_last_name: 'Roux',
      p_phone: null,
      p_relationship: 'Tante',
      p_access_code_hash: '123456',
      p_email: 'nina.roux@demo.invalid',
    });
    expect(error).toBeNull();
    const again = await parentService.inviteGuardian({
      p_child_id: DEMO_IDS.lucas,
      p_first_name: 'Nina',
      p_last_name: 'Roux',
      p_phone: null,
      p_relationship: 'Tante',
      p_access_code_hash: '123456',
      p_email: 'NINA.ROUX@demo.invalid',
    });
    expect(again.error?.code).toBe('23505');
    const guardians = await parentService.getGuardians(DEMO_IDS.lucas);
    expect(guardians.filter(g => g.first_name === 'Nina')).toHaveLength(1);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('never keeps the PIN typed by a visitor', async () => {
    await parentService.inviteGuardian({
      p_child_id: DEMO_IDS.lucas,
      p_first_name: 'Nina',
      p_last_name: 'Roux',
      p_phone: null,
      p_relationship: 'Tante',
      p_access_code_hash: '654321',
      p_email: 'nina.roux@demo.invalid',
    });
    expect(JSON.stringify(store().world)).not.toContain('654321');
  });

  it('propagates a revocation to the establishment scanner', async () => {
    await expect(
      schoolService.validateQr(
        payloadOf('authorized-grandmother'),
        schoolId(),
        DEMO_USER_IDS.establishment
      )
    ).resolves.toMatchObject({ success: true });
    await parentService.toggleGuardian(DEMO_IDS.sophieEmma, false);
    store().enter('establishment');
    const refused = await schoolService.validateQr(
      payloadOf('authorized-grandmother'),
      schoolId(),
      DEMO_USER_IDS.establishment
    );
    expect(refused.success).toBe(false);
    expect(refused.refusal_reason).toBeTruthy();
  });

  it('answers the five scenarios with readable outcomes', async () => {
    store().enter('establishment');
    for (const scenario of DEMO_QR_SCENARIOS) {
      const result = await schoolService.validateQr(
        scenario.payload,
        schoolId(),
        DEMO_USER_IDS.establishment
      );
      expect(result.success).toBe(scenario.expected === 'validated');
      expect(result.child?.first_name).toBeTruthy();
      expect(result.guardian?.first_name).toBeTruthy();
      if (result.success) expect(result.note).toBeTruthy();
      else expect(result.refusal_reason).toBeTruthy();
    }
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('records each scan in the shared history', async () => {
    store().enter('establishment');
    const before = (await schoolService.getPickupValidations(schoolId()))
      .length;
    await schoolService.validateQr(
      payloadOf('authorized-father'),
      schoolId(),
      DEMO_USER_IDS.establishment
    );
    await schoolService.validateQr(
      payloadOf('expired-code'),
      schoolId(),
      DEMO_USER_IDS.establishment
    );
    const after = await schoolService.getPickupValidations(schoolId());
    expect(after.length).toBe(before + 2);
    expect(after[0].status).toBe('refused');
    const stats = await schoolService.getDashboardStats(schoolId());
    expect(stats.enrolledCount).toBe(5);
    store().enter('parent');
    const page = await historyService.fetchPage(DEMO_USER_IDS.parent, {}, null);
    expect(page.items[0].status).toBe('denied');
    expect(page.items[1].status).toBe('completed');
  });

  it('refuses a real token without reaching production', async () => {
    store().enter('establishment');
    const result = await schoolService.validateQr(
      'SC-REALTOKEN',
      schoolId(),
      DEMO_USER_IDS.establishment
    );
    expect(result.success).toBe(false);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('generates a scannable code for the parent and the collector', async () => {
    const parentCode = await qrService.generateQrCode(
      DEMO_USER_IDS.parent,
      DEMO_IDS.emma,
      null
    );
    expect(parentCode.token).toContain('SECURICLICK-DEMO');
    expect(new Date(parentCode.expires_at).getTime()).toBeGreaterThan(
      Date.now()
    );
    await expect(
      qrService.getActiveQrCodes(DEMO_USER_IDS.parent)
    ).resolves.toHaveLength(1);
    await expect(
      schoolService.validateQr(
        parentCode.token,
        schoolId(),
        DEMO_USER_IDS.establishment
      )
    ).resolves.toMatchObject({ success: true });

    store().enter('collector');
    const collectorCode = await collectorService.generateCollectorQrCode(
      DEMO_USER_IDS.collector,
      DEMO_IDS.emma,
      DEMO_IDS.sophieEmma
    );
    await expect(
      collectorService.getCollectorQrCode(
        DEMO_USER_IDS.collector,
        DEMO_IDS.emma
      )
    ).resolves.toMatchObject({ id: collectorCode.id });
  });

  it('shows the collector their children, including a suspended access', async () => {
    store().enter('collector');
    const guardians = await collectorService.getMyGuardians(
      DEMO_USER_IDS.collector
    );
    expect(guardians.map(g => g.child?.first_name).sort()).toEqual([
      'Emma',
      'Lucas',
    ]);
    expect(guardians.some(g => !g.is_active)).toBe(true);
    await expect(
      pickupAuthorizationService.getCollectorSchedules(DEMO_USER_IDS.collector)
    ).resolves.toHaveLength(1);
    await expect(
      collectorService.getMyIdentity(DEMO_USER_IDS.collector)
    ).resolves.toBeNull();
  });

  it('refreshes every screen after a write', async () => {
    queryClient.setQueryData(['parent', 'guardians', DEMO_IDS.emma], []);
    await parentService.toggleGuardian(DEMO_IDS.sophieEmma, false);
    expect(
      queryClient.getQueryState(['parent', 'guardians', DEMO_IDS.emma])
        ?.isInvalidated
    ).toBe(true);
  });

  it('serves notifications locally', async () => {
    const list = await fetchNotifications(DEMO_USER_IDS.parent);
    expect(list.length).toBeGreaterThan(0);
    await markAllRead();
    await expect(fetchUnreadCount(DEMO_USER_IDS.parent)).resolves.toBe(0);
    expect(mockFrom).not.toHaveBeenCalled();
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('keeps writes on the account out of production', async () => {
    await parentService.changePassword('whatever');
    await parentService.updateProfile(DEMO_USER_IDS.parent, {
      first_name: 'A',
      last_name: 'B',
      phone: '',
    });
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

describe('real services', () => {
  beforeEach(() => {
    store().exit();
    mockRpc.mockClear();
  });

  it('refuses a printed demo code without calling the database', async () => {
    const result = await schoolService.validateQr(
      payloadOf('authorized-grandmother'),
      '80000000-0000-0000-0000-000000000001',
      '70000000-0000-0000-0000-000000000001'
    );
    expect(result.success).toBe(false);
    expect(result.refusal_reason).toBeTruthy();
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('still sends a real token to the database', async () => {
    mockRpc.mockImplementation(async () => ({
      data: { success: true },
      error: null,
    }));
    await schoolService.validateQr('SC-REALTOKEN', 'school', 'scanner');
    expect(mockRpc).toHaveBeenCalledWith('validate_qr_and_create_pickup', {
      p_qr_token: 'SC-REALTOKEN',
      p_school_id: 'school',
      p_scanner_user_id: 'scanner',
    });
  });
});
