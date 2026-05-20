import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export type RealtimeState = 'connected' | 'disconnected' | 'unknown';

const POLL_INTERVAL_MS = 8_000;

export function useRealtimeStatus(): RealtimeState {
  const [state, setState] = useState<RealtimeState>('unknown');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const check = () => {
      if (cancelled) return;
      const channels = supabase.getChannels();

      if (channels.length === 0) {
        // No channels yet — not meaningful, keep unknown
        setState('unknown');
        return;
      }

      // At least one channel joined = realtime healthy
      const anyJoined = channels.some(ch => (ch as any).state === 'joined');
      const allClosed = channels.every(ch => (ch as any).state === 'closed' || (ch as any).state === 'errored');

      if (anyJoined) setState('connected');
      else if (allClosed) setState('disconnected');
      else setState('unknown');
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
