import { renderHook, type RenderHookResult } from '@testing-library/react';
import type { ReactNode } from 'react';
import { AuthContext, type AuthContextValue } from '../auth/authContext';

export function authValue(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    session: {
      status: 'authenticated',
      token: 'test-token',
      user: { id: 1, name: 'Admin', email: 'admin@revira.test', phone_number: null, role: 'admin' },
    },
    login: vi.fn(),
    logout: vi.fn(),
    expireSession: vi.fn(),
    ...overrides,
  };
}

export function renderHookWithAuth<TResult, TProps>(
  hook: (props: TProps) => TResult,
  value: AuthContextValue,
  initialProps?: TProps,
): RenderHookResult<TResult, TProps> {
  const wrapper = ({ children }: { children: ReactNode }) => <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;

  return renderHook(hook, { wrapper, initialProps });
}
