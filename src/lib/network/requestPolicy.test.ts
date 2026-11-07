import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { useDemoStore } from '@/features/demo/store/demo.store';
import { createPolicyFetch, isBlockedDuringDemo } from './requestPolicy';

const BASE = 'https://project.supabase.co';

describe('isBlockedDuringDemo', () => {
  it.each([
    `${BASE}/rest/v1/children?select=*`,
    `${BASE}/rest/v1/rpc/validate_qr_and_create_pickup`,
    `${BASE}/storage/v1/object/children-images/x.jpg`,
    `${BASE}/functions/v1/collector-pin-login`,
    `${BASE}/auth/v1/otp`,
    `${BASE}/auth/v1/user`,
    `${BASE}/auth/v1/logout`,
    `${BASE}/auth/v1/signup`,
  ])('blocks %s', url => {
    expect(isBlockedDuringDemo(url)).toBe(true);
  });

  it('blocks a password sign-in', () => {
    expect(
      isBlockedDuringDemo(`${BASE}/auth/v1/token?grant_type=password`)
    ).toBe(true);
  });

  it('lets a real session keep refreshing in the background', () => {
    expect(
      isBlockedDuringDemo(`${BASE}/auth/v1/token?grant_type=refresh_token`)
    ).toBe(false);
  });
});

describe('createPolicyFetch', () => {
  afterEach(() => useDemoStore.getState().exit());

  it('never lets a production request out during the demo', async () => {
    const base = jest.fn(async () => new Response('{}'));
    useDemoStore.getState().enter('parent');
    await expect(
      createPolicyFetch(base as unknown as typeof fetch)(
        `${BASE}/rest/v1/children`
      )
    ).rejects.toThrow('demo_network_blocked');
    expect(base).not.toHaveBeenCalled();
  });

  it('passes requests through outside the demo', async () => {
    const base = jest.fn(async () => new Response('{}'));
    await createPolicyFetch(base as unknown as typeof fetch)(
      `${BASE}/rest/v1/children`
    );
    expect(base).toHaveBeenCalledTimes(1);
  });

  it('aborts a request stuck on a saturated network', async () => {
    jest.useFakeTimers();
    const base = jest.fn(
      (_url: unknown, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () =>
            reject(new Error('aborted'))
          );
        })
    );
    const pending = createPolicyFetch(
      base as unknown as typeof fetch,
      1000
    )(`${BASE}/rest/v1/children`);
    jest.advanceTimersByTime(1000);
    await expect(pending).rejects.toThrow('aborted');
    jest.useRealTimers();
  });

  it('never applies the timeout to a file upload', async () => {
    jest.useFakeTimers();
    const base = jest.fn(async (_url: unknown, init?: RequestInit) => {
      expect(init?.signal).toBeUndefined();
      return new Response('{}');
    });
    await createPolicyFetch(
      base as unknown as typeof fetch,
      1000
    )(`${BASE}/storage/v1/object/a/b.jpg`);
    expect(base).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });
});
