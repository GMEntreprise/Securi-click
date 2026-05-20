import { useCallback, useEffect, useRef, useState } from 'react';
import * as Network from 'expo-network';

export type NetworkState = 'online' | 'offline' | 'unknown';

const POLL_INTERVAL_MS = 10_000;

export function useNetworkStatus(): { state: NetworkState; recheck: () => void } {
  const [state, setState] = useState<NetworkState>('unknown');
  const cancelledRef = useRef(false);

  const check = useCallback(async () => {
    try {
      const net = await Network.getNetworkStateAsync();
      if (cancelledRef.current) return;
      setState(!!net.isConnected && !!net.isInternetReachable ? 'online' : 'offline');
    } catch {
      if (!cancelledRef.current) setState('offline');
    }
  }, []);

  useEffect(() => {
    cancelledRef.current = false;
    check();
    const id = setInterval(check, POLL_INTERVAL_MS);
    return () => {
      cancelledRef.current = true;
      clearInterval(id);
    };
  }, [check]);

  return { state, recheck: check };
}
