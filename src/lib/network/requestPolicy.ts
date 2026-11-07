import { isDemoActive } from '@/features/demo/store/demo.store';

const REQUEST_TIMEOUT_MS = 15_000;
const REFRESH_PATH = '/auth/v1/token';
const STORAGE_PATH = '/storage/v1/';

function urlOf(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

export function isBlockedDuringDemo(url: string): boolean {
  return !(
    url.includes(REFRESH_PATH) && url.includes('grant_type=refresh_token')
  );
}

export function createPolicyFetch(
  baseFetch: typeof fetch,
  timeoutMs = REQUEST_TIMEOUT_MS
): typeof fetch {
  return async (input, init) => {
    const url = urlOf(input);

    if (isDemoActive() && isBlockedDuringDemo(url)) {
      throw new Error('demo_network_blocked');
    }
    if (url.includes(STORAGE_PATH)) return baseFetch(input, init);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const callerSignal = init?.signal;
    if (callerSignal?.aborted) controller.abort();
    const forwardAbort = () => controller.abort();
    callerSignal?.addEventListener('abort', forwardAbort);

    try {
      return await baseFetch(input, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timer);
      callerSignal?.removeEventListener('abort', forwardAbort);
    }
  };
}
