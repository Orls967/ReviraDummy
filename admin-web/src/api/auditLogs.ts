import { apiRequest, type ApiContext } from '../lib/http';
import type { AuditLogEntry, Paginated } from './types';

export function listAuditLogs(context: ApiContext, query: { action: string; page: number }): Promise<Paginated<AuditLogEntry>> {
  return apiRequest<Paginated<AuditLogEntry>>('/admin/audit-logs', { ...context, query });
}
