import { useEffect, useRef, useState } from 'react';
import * as Network from 'expo-network';

export type NetworkState = 'online' | 'offline' | 'unknown';

const POLL_INTERVAL_MS = 10_000;

export function useNetworkStatus(): NetworkState {
  const [state, setState] = useState<NetworkState>('unknown');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const net = await Network.getNetworkStateAsync();
        if (cancelled) return;
        const isOnline = !!net.isConnected && !!net.isInternetReachable;
        setState(isOnline ? 'online' : 'offline');
      } catch {
        if (!cancelled) setState('offline');
      }
    };

    check();
    intervalRef.current = setInterval(check, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return state;
}
