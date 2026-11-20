import { apiRequest, type ApiContext } from '../lib/http';
import type { AdminMember, Paginated } from './types';

export interface MemberQuery {
  status: string;
  planId: string;
  search: string;
  page: number;
}

export function listMembers(context: ApiContext, query: MemberQuery): Promise<Paginated<AdminMember>> {
  return apiRequest<Paginated<AdminMember>>('/admin/members', {
    ...context,
    query: {
      status: query.status,
      membership_plan_id: query.planId,
      search: query.search,
      page: query.page,
    },
  });
}
