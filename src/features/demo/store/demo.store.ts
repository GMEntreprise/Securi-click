import { create } from 'zustand';
import { queryClient } from '@/lib/queryClient';
import { useNotificationStore } from '@/features/notifications/stores/notification.store';
import type { AuthSession } from '@/features/auth/types';
import { createDemoWorld } from '../domain/seed';
import type { DemoRole, DemoWorld } from '../domain/types';
import { createDemoSession } from '../session';

export const DEMO_GUIDE_STEPS = 3;

interface DemoState {
  role: DemoRole | null;
  session: AuthSession | null;
  world: DemoWorld | null;
  guideStep: number | null;
  enter: (role: DemoRole) => void;
  update: (change: (world: DemoWorld) => DemoWorld) => void;
  reset: () => void;
  exit: () => void;
  nextGuideStep: () => void;
  dismissGuide: () => void;
  showGuide: () => void;
}

function discardCachedData(): void {
  queryClient.cancelQueries();
  queryClient.clear();
  useNotificationStore.getState().reset();
}

export const useDemoStore = create<DemoState>((set, get) => ({
  role: null,
  session: null,
  world: null,
  guideStep: null,

  enter: role => {
    const { role: previous, world } = get();
    if (previous === role) return;
    discardCachedData();
    const nextWorld = world ?? createDemoWorld(new Date());
    set({
      role,
      session: createDemoSession(role, nextWorld),
      world: nextWorld,
      guideStep: 0,
    });
  },

  update: change => {
    const { world } = get();
    if (!world) return;
    set({ world: change(world) });
    queryClient.invalidateQueries();
  },

  reset: () => {
    if (!get().role) return;
    set({ world: createDemoWorld(new Date()), guideStep: 0 });
    queryClient.resetQueries();
  },

  exit: () => {
    if (!get().role) return;
    set({ role: null, session: null, world: null, guideStep: null });
    discardCachedData();
  },

  nextGuideStep: () => {
    const { guideStep } = get();
    if (guideStep === null) return;
    set({
      guideStep: guideStep + 1 < DEMO_GUIDE_STEPS ? guideStep + 1 : null,
    });
  },

  dismissGuide: () => set({ guideStep: null }),
  showGuide: () => set({ guideStep: 0 }),
}));

export const isDemoActive = (): boolean =>
  useDemoStore.getState().role !== null;
export const useDemoRole = () => useDemoStore(s => s.role);
export const useDemoSession = () => useDemoStore(s => s.session);
