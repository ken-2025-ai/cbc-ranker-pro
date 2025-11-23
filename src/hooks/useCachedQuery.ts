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
    staleTime: 1000 * 60 * 5, // 5 minutes (reduced from 15 for RAM optimization)
    gcTime: 1000 * 60 * 15, // 15 minutes (reduced from 24h for RAM optimization)
    placeholderData: initialData as any,
    ...options,
  });

  // Update localStorage when data changes (with size limit)
  useEffect(() => {
    if (query.data) {
      try {
        const dataStr = JSON.stringify(query.data);
        const currentSize = JSON.stringify(localStorage).length;
        const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB limit
        
        // Only cache if under size limit
        if (currentSize + dataStr.length < MAX_STORAGE_SIZE) {
          localStorage.setItem(cacheKey, dataStr);
        } else {
          console.warn('localStorage size limit reached, skipping cache');
          // Clear oldest caches if over limit
          clearOldestCaches();
        }
      } catch (e) {
        console.warn('Failed to cache data to localStorage:', e);
        // If QuotaExceededError, clear some cache
        if (e instanceof DOMException && e.name === 'QuotaExceededError') {
          clearOldestCaches();
        }
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

/**
 * Clear oldest caches when storage is full
 */
function clearOldestCaches(): void {
  const cacheKeys = Object.keys(localStorage)
    .filter(key => key.startsWith('cache_'));
  
  // Remove oldest 25% of caches
  const toRemove = Math.ceil(cacheKeys.length * 0.25);
  cacheKeys.slice(0, toRemove).forEach(key => localStorage.removeItem(key));
  
  console.log(`Cleared ${toRemove} old cache entries to free up space`);
}

/**
 * Get current cache size in KB
 */
export function getCacheSize(): number {
  return JSON.stringify(localStorage).length / 1024;
}
