import { useCollectorSessionStore } from '../stores/collectorSession.store';

export { useCollectorSessionStore as useCollectorSession };

export async function markPinVerified(accessCodeVersion: number): Promise<void> {
  await useCollectorSessionStore.getState().markVerified(accessCodeVersion);
}

export async function clearPinVerified(): Promise<void> {
  await useCollectorSessionStore.getState().clear();
}
