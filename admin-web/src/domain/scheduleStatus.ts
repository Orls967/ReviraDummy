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

export interface ScheduleActions {
  canEdit: boolean;
  canStart: boolean;
  canComplete: boolean;
  canCancel: boolean;
}

/**
 * Aksi admin mengikuti status tersimpan (aturan perpindahan di API), dengan penyesuaian dari status tampilan:
 * sesi yang sudah lewat jam mulai tidak bisa diubah jadwalnya, dan sesi yang sudah lewat jam selesai tidak bisa dimulai.
 */
export function scheduleActions(storedStatus: unknown, displayStatus: unknown): ScheduleActions {
  const stored = normalizeScheduleStatus(storedStatus);
  const display = normalizeScheduleStatus(displayStatus);
  const isOpen = stored === 'scheduled' || stored === 'ongoing';

  return {
    canEdit: stored === 'scheduled' && display === 'scheduled',
    canStart: stored === 'scheduled' && display !== 'completed',
    canComplete: isOpen,
    canCancel: isOpen,
  };
}
