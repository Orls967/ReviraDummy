import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { ApiError, GENERIC_ERROR_MESSAGE, isAbortError, type ApiContext } from '../lib/http';

interface QueryResult<T> {
  key: string;
  reload: number;
  data: T | null;
  error: ApiError | null;
}

export interface ApiQuery<T> {
  data: T | null;
  error: ApiError | null;
  isLoading: boolean;
  isRefreshing: boolean;
  reload: () => void;
}

export interface ApiQueryOptions {
  refreshIntervalMs?: number;
}

function toApiError(error: unknown): ApiError {
  return error instanceof ApiError ? error : new ApiError(0, GENERIC_ERROR_MESSAGE);
}

/**
 * Mengambil data setelah sesi siap. Request lama dibatalkan saat key, token, atau komponen berubah,
 * jadi hasil yang terlambat tidak pernah menimpa data yang lebih baru.
 * `key` wajib berubah setiap kali parameter fetcher berubah.
 */
export function useApiQuery<T>(
  key: string,
  fetcher: (context: ApiContext) => Promise<T>,
  options: ApiQueryOptions = {},
): ApiQuery<T> {
  const { session, expireSession } = useAuth();
  const token = session.status === 'authenticated' ? session.token : null;
  const { refreshIntervalMs } = options;
  const fetcherRef = useRef(fetcher);
  const [reloadCount, setReloadCount] = useState(0);
  const [result, setResult] = useState<QueryResult<T> | null>(null);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    if (token === null) {
      return;
    }

    const controller = new AbortController();

    const load = async () => {
      try {
        const data = await fetcherRef.current({ token, signal: controller.signal });

        if (!controller.signal.aborted) {
          setResult({ key, reload: reloadCount, data, error: null });
        }
      } catch (error) {
        if (controller.signal.aborted || isAbortError(error)) {
          return;
        }

        const apiError = toApiError(error);

        if (apiError.status === 401) {
          expireSession();

          return;
        }

        setResult((previous) => ({
          key,
          reload: reloadCount,
          data: previous?.key === key ? previous.data : null,
          error: apiError,
        }));
      }
    };

    void load();

    const intervalId = refreshIntervalMs ? window.setInterval(() => void load(), refreshIntervalMs) : null;

    return () => {
      controller.abort();

      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
    };
  }, [key, token, reloadCount, refreshIntervalMs, expireSession]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);
  const current = result?.key === key ? result : null;

  return {
    data: current?.data ?? null,
    error: current?.error ?? null,
    isLoading: current === null,
    isRefreshing: current !== null && current.reload !== reloadCount,
    reload,
  };
}
