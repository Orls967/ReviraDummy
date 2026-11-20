import { normalizeKey, type StatusMeta } from './tone';

export const SCHEDULE_STATUSES = ['scheduled', 'ongoing', 'completed', 'cancelled'] as const;

export type ScheduleStatus = (typeof SCHEDULE_STATUSES)[number] | 'unknown';

const META: Readonly<Record<ScheduleStatus, StatusMeta>> = {
  scheduled: { label: 'Terjadwal', tone: 'info' },
  ongoing: { label: 'Berlangsung', tone: 'success' },
  completed: { label: 'Selesai', tone: 'neutral' },
  cancelled: { label: 'Dibatalkan', tone: 'danger' },
  unknown: { label: 'Tidak diketahui', tone: 'neutral' },
};

export function normalizeScheduleStatus(value: unknown): ScheduleStatus {
  const key = normalizeKey(value);

  return (SCHEDULE_STATUSES as readonly string[]).includes(key) ? (key as ScheduleStatus) : 'unknown';
}

export function scheduleStatusMeta(value: unknown): StatusMeta {
  return META[normalizeScheduleStatus(value)];
}
