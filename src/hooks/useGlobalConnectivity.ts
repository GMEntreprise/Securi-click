import { useEffect, useRef, useState } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { useRealtimeStatus } from './useRealtimeStatus';

export type ConnectivityStatus =
  | 'online'
  | 'offline'
  | 'realtime_disconnected'
  | 'reconnecting';

// How long a bad state must persist before the banner appears (anti-flash)
const SHOW_DELAY_MS = 2_000;
// How long to show "reconnecting" after coming back online
const RECONNECTING_LINGER_MS = 2_500;

export function useGlobalConnectivity(): ConnectivityStatus {
  const network = useNetworkStatus();
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

    // Network offline — highest priority, show immediately after delay
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

    // Network came back
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

    // Network online but realtime disconnected
    if (network === 'online' && realtime === 'disconnected') {
      clearShow();
      showTimer.current = setTimeout(() => {
        setStatus('realtime_disconnected');
        if (__DEV__) console.log('[Connectivity] banner shown: realtime_disconnected');
      }, SHOW_DELAY_MS);
      return;
    }

    // Everything fine
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

  return status;
}
