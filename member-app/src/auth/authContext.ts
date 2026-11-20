import { createContext } from 'react';
import type { Me } from '../api/types';

export type Session =
  | { status: 'loading' }
  | { status: 'anonymous'; notice: string | null }
  | { status: 'authenticated'; token: string; user: Me };

export interface AuthContextValue {
  session: Session;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  expireSession: () => void;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
