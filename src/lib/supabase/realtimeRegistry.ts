import { supabase } from './client';
import type { RealtimeChannel } from '@supabase/supabase-js';

type Callback = (payload: any) => void;

interface ChannelConfig {
  event: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
  schema: string;
  table: string;
  filter?: string;
}

interface ListenerSet {
  callbacks: Set<Callback>;
  dispatcher: Callback;
}

interface ChannelEntry {
  channel: RealtimeChannel;
  /**
   * configKey → { callbacks, dispatcher }
   * One dispatcher per event-config, registered once before subscribe().
   * New callbacks are added to the Set and get fan-out automatically.
   */
  listeners: Map<string, ListenerSet>;
  /** total subscriber count — when 0, tear down the channel */
  refs: number;
}

const registry = new Map<string, ChannelEntry>();

function configKey(c: ChannelConfig): string {
  return `${c.event}:${c.schema}:${c.table}:${c.filter ?? ''}`;
}

function buildEntry(
  channelKey: string,
  configs: { config: ChannelConfig; callback: Callback }[]
): ChannelEntry {
  const listeners = new Map<string, ListenerSet>();
  let ch = supabase.channel(channelKey);

  for (const { config, callback } of configs) {
    const ck = configKey(config);
    let ls = listeners.get(ck);
    if (!ls) {
      const callbacks = new Set<Callback>();
      const dispatcher: Callback = (payload) => {
        for (const cb of callbacks) cb(payload);
      };
      ls = { callbacks, dispatcher };
      listeners.set(ck, ls);
      ch = ch.on('postgres_changes', config as any, dispatcher);
    }
    ls.callbacks.add(callback);
  }

  const channel = ch.subscribe();
  return { channel, listeners, refs: configs.length };
}

/**
 * Subscribe to one postgres_changes config on a shared channel.
 * Safe to call from multiple simultaneous hook instances.
 * Returns an unsubscribe function to call in useEffect cleanup.
 */
export function subscribeToTable(
  channelKey: string,
  config: ChannelConfig,
  callback: Callback
): () => void {
  return subscribeToTableMulti(channelKey, [{ config, callback }]);
}

/**
 * Subscribe to multiple postgres_changes configs on the same shared channel.
 * All configs must be provided upfront — new configs cannot be added to an
 * already-subscribed channel.
 *
 * On first call: creates the channel with all configs registered before subscribe().
 * On subsequent calls from other instances: adds callbacks to existing dispatchers.
 * If a new config is requested on an existing channel, it is silently ignored —
 * design your channelKeys so all callers share the same set of configs.
 *
 * Returns a single unsubscribe function.
 */
export function subscribeToTableMulti(
  channelKey: string,
  configs: { config: ChannelConfig; callback: Callback }[]
): () => void {
  let entry = registry.get(channelKey);

  if (!entry) {
    entry = buildEntry(channelKey, configs);
    registry.set(channelKey, entry);
  } else {
    // Channel already exists — just add callbacks to existing dispatchers
    entry.refs += configs.length;
    for (const { config, callback } of configs) {
      const ck = configKey(config);
      const ls = entry.listeners.get(ck);
      if (ls) {
        ls.callbacks.add(callback);
      }
      // If ck doesn't exist: new config on subscribed channel — not possible to add.
      // This would be a programming error (mismatched configs for same channelKey).
    }
  }

  const captured = entry;
  const capturedCallbacks = configs.map(({ config, callback }) => ({
    ck: configKey(config),
    callback,
  }));

  return () => {
    captured.refs -= capturedCallbacks.length;
    for (const { ck, callback } of capturedCallbacks) {
      captured.listeners.get(ck)?.callbacks.delete(callback);
    }
    if (captured.refs <= 0) {
      supabase.removeChannel(captured.channel);
      registry.delete(channelKey);
    }
  };
}
