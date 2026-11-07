import { onlineManager } from '@tanstack/react-query';
import * as Network from 'expo-network';

interface NetworkSnapshot {
  isConnected?: boolean | null;
  isInternetReachable?: boolean | null;
}

export function isOnlineFromNetworkState(state: NetworkSnapshot): boolean {
  return state.isConnected !== false && state.isInternetReachable !== false;
}

export function startConnectivitySync(): void {
  onlineManager.setEventListener(setOnline => {
    Network.getNetworkStateAsync()
      .then(state => setOnline(isOnlineFromNetworkState(state)))
      .catch(() => {});
    const subscription = Network.addNetworkStateListener(state => {
      setOnline(isOnlineFromNetworkState(state));
    });
    return () => subscription.remove();
  });
}
