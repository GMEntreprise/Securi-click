import { beforeEach, describe, expect, it } from '@jest/globals';
import { queryClient } from '@/lib/queryClient';
import { useNotificationStore } from '@/features/notifications/stores/notification.store';
import { DEMO_IDS } from '../domain/seed';
import { DEMO_USER_IDS } from '../session';
import { isDemoActive, useDemoStore } from './demo.store';

const store = () => useDemoStore.getState();

describe('demo store', () => {
  beforeEach(() => {
    store().exit();
    queryClient.clear();
  });

  it('starts inactive with no fictional data in memory', () => {
    expect(isDemoActive()).toBe(false);
    expect(store().world).toBeNull();
    expect(store().session).toBeNull();
  });

  it('greets each role with its fictional name, never its technical id', () => {
    store().enter('parent');
    expect(store().session?.user.profile).toMatchObject({
      first_name: 'Camille',
      last_name: 'Martin',
    });
    store().enter('collector');
    expect(store().session?.user.profile?.first_name).toBe('Sophie');
    store().enter('establishment');
    expect(store().session?.user.profile?.first_name).toBe('Claire');
  });

  it('opens a role with a session that holds no credentials', () => {
    store().enter('parent');
    expect(isDemoActive()).toBe(true);
    expect(store().session?.user.id).toBe(DEMO_USER_IDS.parent);
    expect(store().session?.user.role).toBe('parent');
    expect(store().session?.access_token).toBe('');
    expect(store().session?.refresh_token).toBe('');
  });

  it('maps the establishment role to a school admin session', () => {
    store().enter('establishment');
    expect(store().session?.user.role).toBe('school_admin');
  });

  it('keeps changes when switching role, so every role sees one truth', () => {
    store().enter('parent');
    store().update(world => ({
      ...world,
      guardians: world.guardians.filter(g => g.id !== DEMO_IDS.julieEmma),
    }));
    store().enter('establishment');
    expect(store().role).toBe('establishment');
    expect(
      store().world?.guardians.some(g => g.id === DEMO_IDS.julieEmma)
    ).toBe(false);
  });

  it('drops the previous role cache when switching role', () => {
    store().enter('parent');
    queryClient.setQueryData(['parent', 'children', DEMO_USER_IDS.parent], []);
    useNotificationStore.getState().setUnreadCount(3);
    store().enter('collector');
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });

  it('restores the initial data and guide on reset and keeps the role', () => {
    store().enter('parent');
    store().dismissGuide();
    store().update(world => ({ ...world, guardians: [] }));
    store().reset();
    expect(store().role).toBe('parent');
    expect(store().world?.guardians.length).toBeGreaterThan(0);
    expect(store().guideStep).toBe(0);
  });

  it('forgets everything on exit', () => {
    store().enter('collector');
    store().update(world => ({ ...world, guardians: [] }));
    queryClient.setQueryData(
      ['collector-guardians', DEMO_USER_IDS.collector],
      []
    );
    store().exit();
    expect(isDemoActive()).toBe(false);
    expect(store().world).toBeNull();
    expect(store().session).toBeNull();
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });

  it('ignores a write once the demo has ended', () => {
    store().enter('parent');
    store().exit();
    store().update(world => ({ ...world, guardians: [] }));
    expect(store().world).toBeNull();
  });

  it('walks the guide and can replay it', () => {
    store().enter('establishment');
    expect(store().guideStep).toBe(0);
    store().nextGuideStep();
    expect(store().guideStep).toBe(1);
    store().nextGuideStep();
    store().nextGuideStep();
    expect(store().guideStep).toBeNull();
    store().showGuide();
    expect(store().guideStep).toBe(0);
  });
});
