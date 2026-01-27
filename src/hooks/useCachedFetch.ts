// src/hooks/useCachedFetch.ts
import { useEffect, useState } from 'react';

interface UseCachedFetchOptions<T> {
  cacheKey: string;
  ttlMs?: number;
  fetcher: () => Promise<T>;
}

interface CacheRecord<T> {
  data: T;
  timestamp: number;
}

export function useCachedFetch<T>(
  options: UseCachedFetchOptions<T>
) {
  const { cacheKey, ttlMs = 1000 * 60 * 5, fetcher } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        // 1. Try cache
        const cachedRaw = localStorage.getItem(cacheKey);
        if (cachedRaw) {
          const cached: CacheRecord<T> = JSON.parse(cachedRaw);
          const isValid =
            Date.now() - cached.timestamp < ttlMs;

          if (isValid) {
            setData(cached.data);
            setLoading(false);
          }
        }

        // 2. Try network
        try {
          const fresh = await fetcher();
          if (cancelled) return;

          setData(fresh);
          setLoading(false);

          const record: CacheRecord<T> = {
            data: fresh,
            timestamp: Date.now(),
          };
          localStorage.setItem(cacheKey, JSON.stringify(record));
        } catch (networkErr) {
          // If offline and we had no cache, show error
          if (!cachedRaw) {
            setError(networkErr);
            setLoading(false);
          }
        }
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [cacheKey, ttlMs, fetcher]);

  return { data, loading, error };
}
