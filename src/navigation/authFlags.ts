// Module-level flags shared between navigation and AuthStateSync.
// These are plain booleans (not React state) so they update synchronously
// without triggering re-renders.

export let explicitLogoutInProgress = false;

export function setExplicitLogoutInProgress(value: boolean) {
  explicitLogoutInProgress = value;
}
