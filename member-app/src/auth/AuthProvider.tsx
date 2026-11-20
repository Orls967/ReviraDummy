import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { fetchMe, login as loginRequest, logout as logoutRequest } from '../api/auth';
import { ApiError, isAbortError, NETWORK_ERROR_MESSAGE } from '../lib/http';
import { tokenStorage } from '../lib/tokenStorage';
import { AuthContext, type AuthContextValue, type Session } from './authContext';

const ADMIN_NOT_ALLOWED = 'Akun admin tidak bisa dipakai di aplikasi member. Gunakan panel admin.';
const EXPIRED_MESSAGE = 'Sesi Anda berakhir. Silakan masuk kembali.';

function revokeQuietly(token: string): void {
  logoutRequest(token).catch(() => undefined);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>({ status: 'loading' });
  const sessionRef = useRef(session);

  useEffect(() => {
    sessionRef.current = session;
  });

  useEffect(() => {
    const controller = new AbortController();

    const restore = async () => {
      const token = await tokenStorage.read();

      if (token === null) {
        setSession({ status: 'anonymous', notice: null });

        return;
      }

      try {
        const user = await fetchMe({ token, signal: controller.signal });

        if (user.role !== 'member') {
          await tokenStorage.clear();
          setSession({ status: 'anonymous', notice: ADMIN_NOT_ALLOWED });

          return;
        }

        setSession({ status: 'authenticated', token, user });
      } catch (error) {
        if (isAbortError(error)) {
          return;
        }

        if (error instanceof ApiError && error.status === 401) {
          await tokenStorage.clear();
          setSession({ status: 'anonymous', notice: EXPIRED_MESSAGE });

          return;
        }

        setSession({ status: 'anonymous', notice: NETWORK_ERROR_MESSAGE });
      }
    };

    void restore();

    return () => controller.abort();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginRequest(email, password);

    if (result.user.role !== 'member') {
      revokeQuietly(result.token);
      throw new ApiError(403, ADMIN_NOT_ALLOWED);
    }

    await tokenStorage.write(result.token);
    setSession({ status: 'authenticated', token: result.token, user: result.user });
  }, []);

  const logout = useCallback(async () => {
    const current = sessionRef.current;
    await tokenStorage.clear();
    setSession({ status: 'anonymous', notice: null });

    if (current.status === 'authenticated') {
      revokeQuietly(current.token);
    }
  }, []);

  const expireSession = useCallback(() => {
    void tokenStorage.clear();
    setSession({ status: 'anonymous', notice: EXPIRED_MESSAGE });
  }, []);

  /** Muat ulang profil (status membership) tanpa mengganti token, mis. setelah mengajukan membership. */
  const refreshProfile = useCallback(async () => {
    const current = sessionRef.current;

    if (current.status !== 'authenticated') {
      return;
    }

    try {
      const user = await fetchMe({ token: current.token });

      setSession((latest) => (latest.status === 'authenticated' && latest.token === current.token ? { ...latest, user } : latest));
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        expireSession();
      }
    }
  }, [expireSession]);

  const value = useMemo<AuthContextValue>(
    () => ({ session, login, logout, expireSession, refreshProfile }),
    [session, login, logout, expireSession, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
