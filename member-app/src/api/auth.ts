import { apiRequest, apiSend, type ApiContext } from '../lib/http';
import type { AuthSession, DataResponse, Me } from './types';

export async function login(email: string, password: string): Promise<AuthSession> {
  const response = await apiRequest<DataResponse<AuthSession>>('/login', {
    method: 'POST',
    body: { email, password, device_name: 'member-app' },
  });

  return response.data;
}

export async function fetchMe(context: ApiContext): Promise<Me> {
  const response = await apiRequest<DataResponse<Me>>('/me', context);

  return response.data;
}

export function logout(token: string): Promise<void> {
  return apiSend('/logout', { method: 'POST', token });
}
