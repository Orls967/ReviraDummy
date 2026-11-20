import { apiRequest, apiSend, type ApiContext } from '../lib/http';
import type { DataResponse, MembershipPlan, MembershipPlanInput } from './types';

export async function listPlans(context: ApiContext): Promise<MembershipPlan[]> {
  const response = await apiRequest<DataResponse<MembershipPlan[]>>('/admin/membership-plans', context);

  return response.data;
}

export async function createPlan(context: ApiContext, input: MembershipPlanInput): Promise<MembershipPlan> {
  const response = await apiRequest<DataResponse<MembershipPlan>>('/admin/membership-plans', {
    ...context,
    method: 'POST',
    body: input,
  });

  return response.data;
}

export async function updatePlan(context: ApiContext, id: number, input: MembershipPlanInput): Promise<MembershipPlan> {
  const response = await apiRequest<DataResponse<MembershipPlan>>(`/admin/membership-plans/${id}`, {
    ...context,
    method: 'PUT',
    body: input,
  });

  return response.data;
}

export function deletePlan(context: ApiContext, id: number): Promise<void> {
  return apiSend(`/admin/membership-plans/${id}`, { ...context, method: 'DELETE' });
}
