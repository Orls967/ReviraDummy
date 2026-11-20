import { apiRequest, type ApiContext } from '../lib/http';
import type { ClassSchedule, DataResponse } from './types';

export async function listSchedules(context: ApiContext, range: { from: string; to: string }): Promise<ClassSchedule[]> {
  const response = await apiRequest<DataResponse<ClassSchedule[]>>('/member/class-schedules', { ...context, query: range });

  return response.data;
}

export async function getSchedule(context: ApiContext, id: number): Promise<ClassSchedule> {
  const response = await apiRequest<DataResponse<ClassSchedule>>(`/member/class-schedules/${id}`, context);

  return response.data;
}

export async function bookSchedule(context: ApiContext, id: number): Promise<ClassSchedule> {
  const response = await apiRequest<DataResponse<ClassSchedule>>(`/member/class-schedules/${id}/booking`, {
    ...context,
    method: 'POST',
  });

  return response.data;
}

export async function cancelBooking(context: ApiContext, id: number): Promise<ClassSchedule> {
  const response = await apiRequest<DataResponse<ClassSchedule>>(`/member/class-schedules/${id}/booking`, {
    ...context,
    method: 'DELETE',
  });

  return response.data;
}

export async function listBookings(context: ApiContext): Promise<ClassSchedule[]> {
  const response = await apiRequest<DataResponse<ClassSchedule[]>>('/member/bookings', context);

  return response.data;
}
