import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { directoryService } from './directory.service';
import { normalizeUai } from './normalizeUai';
import { directoryQueryKeys } from './queryKeys';

export function useDebouncedDirectorySearch(query: string, delay = 350) {
  const [debouncedQuery, setDebouncedQuery] = useState(query.trim());
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), delay);
    return () => clearTimeout(timer);
  }, [delay, query]);

  const result = useInfiniteQuery({
    queryKey: directoryQueryKeys.search(debouncedQuery),
    queryFn: ({ pageParam }) =>
      directoryService.search(debouncedQuery, pageParam),
    initialPageParam: 0,
    getNextPageParam: page => (page.hasMore ? page.page + 1 : undefined),
    enabled: debouncedQuery.length >= 2,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
  const establishments = useMemo(
    () => result.data?.pages.flatMap(page => page.data) ?? [],
    [result.data]
  );
  return { ...result, debouncedQuery, establishments };
}

export function useEstablishmentByUai(input: string, enabled: boolean) {
  const uai = normalizeUai(input);
  return useQuery({
    queryKey: directoryQueryKeys.uai(uai),
    queryFn: () => directoryService.byUai(uai),
    enabled,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}

export function useClaimEstablishment() {
  return useMutation({
    mutationFn: (uai: string) => directoryService.claim(uai),
  });
}
