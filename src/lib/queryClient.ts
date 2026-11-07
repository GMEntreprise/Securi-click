import { QueryClient, onlineManager } from '@tanstack/react-query';

export function shouldRetryQuery(failureCount: number): boolean {
  return onlineManager.isOnline() && failureCount < 1;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 60 * 24,
      retry: shouldRetryQuery,
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: 0,
      networkMode: 'always',
    },
  },
});
