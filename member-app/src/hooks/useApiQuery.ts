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
  setData: (data: T) => void;
}

/**
 * Mengambil data setelah sesi siap. Request lama dibatalkan saat key, token, atau layar berubah,
 * jadi hasil yang terlambat tidak pernah menimpa data yang lebih baru.
 * `key` wajib berubah setiap kali parameter fetcher berubah.
 */
export function useApiQuery<T>(key: string, fetcher: (context: ApiContext) => Promise<T>): ApiQuery<T> {
  const { session, expireSession } = useAuth();
  const token = session.status === 'authenticated' ? session.token : null;
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

        const apiError = error instanceof ApiError ? error : new ApiError(0, GENERIC_ERROR_MESSAGE);

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

    return () => controller.abort();
  }, [key, token, reloadCount, expireSession]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  const setData = useCallback(
    (data: T) => setResult((previous) => (previous?.key === key ? { ...previous, data, error: null } : previous)),
    [key],
  );

  const current = result?.key === key ? result : null;

  return {
    data: current?.data ?? null,
    error: current?.error ?? null,
    isLoading: current === null,
    isRefreshing: current !== null && current.reload !== reloadCount,
    reload,
    setData,
  };
}
