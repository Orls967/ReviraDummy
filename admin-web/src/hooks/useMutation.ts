import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { ApiError, GENERIC_ERROR_MESSAGE, isAbortError, type ApiContext } from '../lib/http';

export type MutationOutcome<T> = { status: 'success'; data: T } | { status: 'error'; error: ApiError } | { status: 'skipped' };

export interface Mutation<TArgs, TResult> {
  run: (args: TArgs) => Promise<MutationOutcome<TResult>>;
  isPending: boolean;
  error: ApiError | null;
  reset: () => void;
}

/**
 * Menjalankan aksi tulis dengan kunci: panggilan kedua selama aksi pertama berjalan diabaikan
 * (status "skipped"), sehingga klik ganda tidak mengirim dua request.
 */
export function useMutation<TArgs, TResult>(
  action: (context: ApiContext, args: TArgs) => Promise<TResult>,
): Mutation<TArgs, TResult> {
  const { session, expireSession } = useAuth();
  const token = session.status === 'authenticated' ? session.token : null;
  const actionRef = useRef(action);
  const pendingRef = useRef(false);
  const controllerRef = useRef<AbortController | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    actionRef.current = action;
  });

  useEffect(() => () => controllerRef.current?.abort(), []);

  const run = useCallback(
    async (args: TArgs): Promise<MutationOutcome<TResult>> => {
      if (pendingRef.current) {
        return { status: 'skipped' };
      }

      if (token === null) {
        expireSession();

        return { status: 'skipped' };
      }

      const controller = new AbortController();
      controllerRef.current = controller;
      pendingRef.current = true;
      setIsPending(true);
      setError(null);

      try {
        const data = await actionRef.current({ token, signal: controller.signal }, args);

        return { status: 'success', data };
      } catch (caught) {
        if (controller.signal.aborted || isAbortError(caught)) {
          return { status: 'skipped' };
        }

        const apiError = caught instanceof ApiError ? caught : new ApiError(0, GENERIC_ERROR_MESSAGE);

        if (apiError.status === 401) {
          expireSession();
        } else {
          setError(apiError);
        }

        return { status: 'error', error: apiError };
      } finally {
        pendingRef.current = false;

        if (!controller.signal.aborted) {
          setIsPending(false);
        }
      }
    },
    [token, expireSession],
  );

  const reset = useCallback(() => setError(null), []);

  return { run, isPending, error, reset };
}
