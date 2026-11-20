import { apiRequest, apiSend, type ApiContext } from '../lib/http';
import type { AuthSession, DataResponse, User } from './types';

export async function login(email: string, password: string): Promise<AuthSession> {
  const response = await apiRequest<DataResponse<AuthSession>>('/login', {
    method: 'POST',
    body: { email, password, device_name: 'admin-web' },
  });

  return response.data;
}

export async function fetchCurrentUser(context: ApiContext): Promise<User> {
  const response = await apiRequest<DataResponse<User>>('/me', context);

  return response.data;
}

export function logout(token: string): Promise<void> {
  return apiSend('/logout', { method: 'POST', token });
}
