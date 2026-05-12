import { useCallback, useRef, useState } from 'react';

interface UseDebouncedCallbackOptions {
  delay?: number;
  leading?: boolean;
  trailing?: boolean;
}

interface UseDebouncedCallbackState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  lastCall: number;
}

export function useDebouncedCallback<T extends any[], R>(
  callback: (...args: T) => Promise<R>,
  options: UseDebouncedCallbackOptions = {}
) {
  const { delay = 300, leading = false, trailing = true } = options;

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [state, setState] = useState<UseDebouncedCallbackState<R>>({
    data: null,
    loading: false,
    error: null,
    lastCall: 0,
  });

  const debouncedCallback = useCallback(
    (...args: T) => {
      const now = Date.now();

      setState(prev => ({ ...prev, lastCall: now, error: null }));

      if (leading && now - state.lastCall > delay) {
        executeCallback(...args);
        return;
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (trailing) {
        timeoutRef.current = setTimeout(() => {
          executeCallback(...args);
        }, delay);
      }
    },
    [callback, delay, leading, trailing, state.lastCall]
  );

  const executeCallback = useCallback(
    async (...args: T) => {
      try {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();
        setState(prev => ({ ...prev, loading: true, error: null }));

        const result = await callback(...args);

        setState({
          data: result,
          loading: false,
          error: null,
          lastCall: Date.now(),
        });
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          setState(prev => ({
            ...prev,
            loading: false,
            error: error as Error,
          }));
        }
      }
    },
    [callback]
  );

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setState(prev => ({ ...prev, loading: false }));
  }, []);

  const reset = useCallback(() => {
    cancel();
    setState({
      data: null,
      loading: false,
      error: null,
      lastCall: 0,
    });
  }, [cancel]);

  return {
    ...state,
    execute: debouncedCallback,
    cancel,
    reset,
  };
}
