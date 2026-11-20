import { apiRequest, type ApiContext } from '../lib/http';
import type { AdminTransaction, DataResponse, Paginated } from './types';

export function listTransactions(
  context: ApiContext,
  query: { status: string; page: number },
): Promise<Paginated<AdminTransaction>> {
  return apiRequest<Paginated<AdminTransaction>>('/admin/transactions', { ...context, query });
}

export async function approveTransaction(context: ApiContext, id: number): Promise<AdminTransaction> {
  const response = await apiRequest<DataResponse<AdminTransaction>>(`/admin/transactions/${id}/approve`, {
    ...context,
    method: 'POST',
  });

  return response.data;
}

export async function rejectTransaction(context: ApiContext, id: number, reason: string): Promise<AdminTransaction> {
  const response = await apiRequest<DataResponse<AdminTransaction>>(`/admin/transactions/${id}/reject`, {
    ...context,
    method: 'POST',
    body: { reason },
  });

  return response.data;
}
