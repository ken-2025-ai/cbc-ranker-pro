import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

/**
 * Enhanced query hook with localStorage backup for ultra-fast initial loads
 */
export function useCachedQuery<TData>(
  key: string[],
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData>, 'queryKey' | 'queryFn'>
) {
  const cacheKey = `cache_${key.join('_')}`;
  const [initialData, setInitialData] = useState<TData | undefined>();

  // Load from localStorage on mount for instant display
  useEffect(() => {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        setInitialData(JSON.parse(cached));
      } catch (e) {
        console.warn('Failed to parse cached data:', e);
      }
    }
  }, [cacheKey]);

  const query = useQuery({
    queryKey: key,
    queryFn,
    staleTime: 1000 * 60 * 15, // 15 minutes
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    placeholderData: initialData as any,
    ...options,
  });

  // Update localStorage when data changes
  useEffect(() => {
    if (query.data) {
      try {
        localStorage.setItem(cacheKey, JSON.stringify(query.data));
      } catch (e) {
        console.warn('Failed to cache data to localStorage:', e);
      }
    }
  }, [query.data, cacheKey]);

  return query;
}

/**
 * Preload data into cache before it's needed
 */
export function prefetchToCacheStorage<TData>(
  key: string,
  data: TData
): void {
  try {
    localStorage.setItem(`cache_${key}`, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to prefetch to cache:', e);
  }
}

/**
 * Clear specific cache or all caches
 */
export function clearCache(pattern?: string): void {
  if (pattern) {
    Object.keys(localStorage)
      .filter(key => key.startsWith(`cache_${pattern}`))
      .forEach(key => localStorage.removeItem(key));
  } else {
    Object.keys(localStorage)
      .filter(key => key.startsWith('cache_'))
      .forEach(key => localStorage.removeItem(key));
  }
}
