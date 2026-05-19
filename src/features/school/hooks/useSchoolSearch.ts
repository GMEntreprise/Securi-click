import { useQuery } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { schoolSearchService, type SchoolSearchResult } from '../services/schoolSearch.service';

const SCHOOL_SEARCH_KEY = (query: string) =>
  ['school', 'search', query] as const;

export function useSchoolSearch() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleQueryChange = useCallback((text: string) => {
    setQuery(text);
    if (debounceTimer) clearTimeout(debounceTimer);
    const t = setTimeout(() => setDebouncedQuery(text), 300);
    setDebounceTimer(t);
  }, [debounceTimer]);

  const searchQuery = useQuery({
    queryKey: SCHOOL_SEARCH_KEY(debouncedQuery),
    queryFn: () => schoolSearchService.search(debouncedQuery),
    enabled: debouncedQuery.trim().length >= 2,
    staleTime: 60 * 1000,
    placeholderData: prev => prev,
  });

  const results: SchoolSearchResult[] = searchQuery.data ?? [];
  const isSearching = searchQuery.isFetching && debouncedQuery.length >= 2;
  const isEmpty = !isSearching && debouncedQuery.length >= 2 && results.length === 0;

  return {
    query,
    setQuery: handleQueryChange,
    results,
    isSearching,
    isEmpty,
    clear: useCallback(() => {
      setQuery('');
      setDebouncedQuery('');
    }, []),
  };
}
