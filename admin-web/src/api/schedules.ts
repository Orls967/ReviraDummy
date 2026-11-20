import { apiRequest, apiSend, type ApiContext } from '../lib/http';
import type { ClassSchedule, ClassScheduleInput, DataResponse, GymClass, Instructor, ScheduleStatusChange } from './types';

export async function listSchedules(context: ApiContext, range: { from: string; to: string }): Promise<ClassSchedule[]> {
  const response = await apiRequest<DataResponse<ClassSchedule[]>>('/admin/class-schedules', { ...context, query: range });

  return response.data;
}

export async function getSchedule(context: ApiContext, id: number): Promise<ClassSchedule> {
  const response = await apiRequest<DataResponse<ClassSchedule>>(`/admin/class-schedules/${id}`, context);

  return response.data;
}

export async function createSchedule(context: ApiContext, input: ClassScheduleInput): Promise<ClassSchedule> {
  const response = await apiRequest<DataResponse<ClassSchedule>>('/admin/class-schedules', {
    ...context,
    method: 'POST',
    body: input,
  });

  return response.data;
}

export async function updateSchedule(context: ApiContext, id: number, input: ClassScheduleInput): Promise<ClassSchedule> {
  const response = await apiRequest<DataResponse<ClassSchedule>>(`/admin/class-schedules/${id}`, {
    ...context,
    method: 'PUT',
    body: input,
  });

  return response.data;
}

export async function changeScheduleStatus(
  context: ApiContext,
  id: number,
  change: ScheduleStatusChange,
): Promise<ClassSchedule> {
  const response = await apiRequest<DataResponse<ClassSchedule>>(`/admin/class-schedules/${id}/status`, {
    ...context,
    method: 'PATCH',
    body: change,
  });

  return response.data;
}

export function deleteSchedule(context: ApiContext, id: number): Promise<void> {
  return apiSend(`/admin/class-schedules/${id}`, { ...context, method: 'DELETE' });
}

export async function listClasses(context: ApiContext): Promise<GymClass[]> {
  const response = await apiRequest<DataResponse<GymClass[]>>('/admin/classes', context);

  return response.data;
}

export async function listInstructors(context: ApiContext): Promise<Instructor[]> {
  const response = await apiRequest<DataResponse<Instructor[]>>('/admin/instructors', context);

  return response.data;
}
