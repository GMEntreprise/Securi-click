import { afterEach, describe, expect, it } from '@jest/globals';
import { onlineManager } from '@tanstack/react-query';
import { queryClient, shouldRetryQuery } from './queryClient';
import { isOnlineFromNetworkState } from './offline/connectivity';

describe('query defaults', () => {
  afterEach(() => onlineManager.setOnline(true));

  it('retries once while online', () => {
    onlineManager.setOnline(true);
    expect(shouldRetryQuery(0)).toBe(true);
    expect(shouldRetryQuery(1)).toBe(false);
  });

  it('fails straight away offline so a screen can answer', () => {
    onlineManager.setOnline(false);
    expect(shouldRetryQuery(0)).toBe(false);
  });

  it('runs reads first and never queues a write for later', () => {
    const defaults = queryClient.getDefaultOptions();
    expect(defaults.queries?.networkMode).toBe('offlineFirst');
    expect(defaults.mutations?.networkMode).toBe('always');
    expect(defaults.mutations?.retry).toBe(0);
  });
});

describe('isOnlineFromNetworkState', () => {
  it.each([
    [{ isConnected: true, isInternetReachable: true }, true],
    [{ isConnected: true, isInternetReachable: undefined }, true],
    [{ isConnected: undefined, isInternetReachable: undefined }, true],
    [{ isConnected: true, isInternetReachable: false }, false],
    [{ isConnected: false, isInternetReachable: undefined }, false],
  ])('%j → %s', (state, expected) => {
    expect(isOnlineFromNetworkState(state)).toBe(expected);
  });
});
