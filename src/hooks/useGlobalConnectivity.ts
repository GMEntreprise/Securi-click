import { useCallback, useEffect, useRef, useState } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { useRealtimeStatus } from './useRealtimeStatus';

export type ConnectivityStatus =
  | 'online'
  | 'offline'
  | 'realtime_disconnected'
  | 'reconnecting';

const SHOW_DELAY_MS = 2_000;
const RECONNECTING_LINGER_MS = 2_500;

export function useGlobalConnectivity(): {
  status: ConnectivityStatus;
  retry: () => void;
} {
  const { state: network, recheck } = useNetworkStatus();
  const realtime = useRealtimeStatus();

  const [status, setStatus] = useState<ConnectivityStatus>('online');
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevOffline = useRef(false);

  useEffect(() => {
    const clearShow = () => {
      if (showTimer.current) { clearTimeout(showTimer.current); showTimer.current = null; }
    };
    const clearReconnect = () => {
      if (reconnectTimer.current) { clearTimeout(reconnectTimer.current); reconnectTimer.current = null; }
    };

    if (network === 'offline') {
      clearReconnect();
      if (!prevOffline.current) {
        prevOffline.current = true;
        clearShow();
        showTimer.current = setTimeout(() => {
          setStatus('offline');
          if (__DEV__) console.log('[Connectivity] banner shown: offline');
        }, SHOW_DELAY_MS);
      }
      return;
    }

    if (prevOffline.current && network === 'online') {
      prevOffline.current = false;
      clearShow();
      clearReconnect();
      setStatus('reconnecting');
      if (__DEV__) console.log('[Connectivity] banner shown: reconnecting');
      reconnectTimer.current = setTimeout(() => {
        setStatus('online');
        if (__DEV__) console.log('[Connectivity] banner hidden: online');
      }, RECONNECTING_LINGER_MS);
      return;
    }

    if (network === 'online' && realtime === 'disconnected') {
      clearShow();
      showTimer.current = setTimeout(() => {
        setStatus('realtime_disconnected');
        if (__DEV__) console.log('[Connectivity] banner shown: realtime_disconnected');
      }, SHOW_DELAY_MS);
      return;
    }

    if (network === 'online' && (realtime === 'connected' || realtime === 'unknown')) {
      clearShow();
      if (status !== 'reconnecting') {
        setStatus('online');
        if (__DEV__) console.log('[Connectivity] banner hidden: online');
      }
    }

    return () => { clearShow(); clearReconnect(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [network, realtime]);

  const retry = useCallback(() => {
    if (__DEV__) console.log('[Connectivity] retry triggered');
    setStatus('reconnecting');
    prevOffline.current = false;
    recheck();
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    reconnectTimer.current = setTimeout(() => {
      setStatus(s => s === 'reconnecting' ? 'online' : s);
    }, RECONNECTING_LINGER_MS);
  }, [recheck]);

  return { status, retry };
}
