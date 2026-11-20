import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fetchCurrentUser, login as loginRequest, logout as logoutRequest } from '../api/auth';
import { ApiError, isAbortError, NETWORK_ERROR_MESSAGE } from '../lib/http';
import { tokenStorage } from '../lib/tokenStorage';
import { AuthContext, type AuthContextValue, type Session } from './authContext';

const NOT_ADMIN_MESSAGE = 'Akun ini bukan akun admin.';
const EXPIRED_MESSAGE = 'Sesi Anda berakhir. Silakan masuk kembali.';

function initialSession(): Session {
  return tokenStorage.read() === null ? { status: 'anonymous', notice: null } : { status: 'loading' };
}

function revokeQuietly(token: string): void {
  logoutRequest(token).catch(() => undefined);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>(initialSession);

  useEffect(() => {
    const storedToken = tokenStorage.read();

    if (storedToken === null) {
      return;
    }

    const controller = new AbortController();

    fetchCurrentUser({ token: storedToken, signal: controller.signal })
      .then((user) => {
        if (user.role !== 'admin') {
          tokenStorage.clear();
          setSession({ status: 'anonymous', notice: NOT_ADMIN_MESSAGE });

          return;
        }

        setSession({ status: 'authenticated', token: storedToken, user });
      })
      .catch((error: unknown) => {
        if (isAbortError(error)) {
          return;
        }

        if (error instanceof ApiError && error.status === 401) {
          tokenStorage.clear();
          setSession({ status: 'anonymous', notice: EXPIRED_MESSAGE });

          return;
        }

        setSession({ status: 'anonymous', notice: NETWORK_ERROR_MESSAGE });
      });

    return () => controller.abort();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginRequest(email, password);

    if (result.user.role !== 'admin') {
      revokeQuietly(result.token);
      throw new ApiError(403, NOT_ADMIN_MESSAGE);
    }

    tokenStorage.write(result.token);
    setSession({ status: 'authenticated', token: result.token, user: result.user });
  }, []);

  const logout = useCallback(async () => {
    const token = tokenStorage.read();
    tokenStorage.clear();
    setSession({ status: 'anonymous', notice: null });

    if (token !== null) {
      revokeQuietly(token);
    }
  }, []);

  const expireSession = useCallback(() => {
    tokenStorage.clear();
    setSession({ status: 'anonymous', notice: EXPIRED_MESSAGE });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ session, login, logout, expireSession }),
    [session, login, logout, expireSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
