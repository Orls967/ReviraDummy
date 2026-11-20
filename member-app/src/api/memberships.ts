import { apiRequest, type ApiContext } from '../lib/http';
import type { DataResponse, Membership, MembershipApplication, MembershipPlan } from './types';

export async function listPlans(context: ApiContext): Promise<MembershipPlan[]> {
  const response = await apiRequest<DataResponse<MembershipPlan[]>>('/membership-plans', { signal: context.signal });

  return response.data;
}

export async function listMemberships(context: ApiContext): Promise<Membership[]> {
  const response = await apiRequest<DataResponse<Membership[]>>('/member/memberships', context);

  return response.data;
}

export async function applyMembership(context: ApiContext, application: MembershipApplication): Promise<Membership> {
  const response = await apiRequest<DataResponse<Membership>>('/member/memberships', {
    ...context,
    method: 'POST',
    body: application,
  });

  return response.data;
}
