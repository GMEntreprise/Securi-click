import { i18n } from '@/i18n';
import { useDemoStore } from '../store/demo.store';
import type { DemoWorld } from '../domain/types';

export function readWorld(): DemoWorld {
  const { world } = useDemoStore.getState();
  if (!world) throw new Error(i18n.t('demo:demo_ended'));
  return world;
}

export function writeWorld(change: (world: DemoWorld) => DemoWorld): void {
  useDemoStore.getState().update(change);
}

export function demoUnavailable(): Error {
  return new Error(i18n.t('demo:demo_action_unavailable'));
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function demoId(prefix: string): string {
  return `demo-${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
