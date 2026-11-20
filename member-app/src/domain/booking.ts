import { toLocalDateTime } from '../lib/dates';
import { normalizeKey } from './tone';
import { normalizeScheduleStatus } from './scheduleStatus';

export interface BookableSchedule {
  status: string;
  display_status: string;
  schedule_date: string;
  start_time: string;
  is_booked?: boolean;
}

export interface MembershipPeriod {
  status: string;
  start_date: string;
  end_date: string | null;
}

export type BookingAvailability =
  | { action: 'book'; enabled: true }
  | { action: 'cancel'; enabled: boolean; reason: string | null }
  | { action: 'none'; enabled: false; reason: string };

export const BOOKING_REASONS = {
  cancelled: 'Sesi ini dibatalkan oleh gym.',
  started: 'Sesi sudah dimulai atau selesai.',
  inactive: 'Membership Anda tidak aktif pada tanggal sesi ini.',
  cancelClosed: 'Booking tidak bisa dibatalkan karena sesi sudah dimulai.',
} as const;

/**
 * Aturan sama dengan API: membership berstatus active dengan start_date <= tanggal sesi <= end_date.
 */
export function isMembershipActiveOn(memberships: readonly MembershipPeriod[], isoDate: string): boolean {
  return memberships.some(
    (membership) =>
      normalizeKey(membership.status) === 'active' &&
      membership.end_date !== null &&
      membership.start_date <= isoDate &&
      isoDate <= membership.end_date,
  );
}

function hasStarted(schedule: BookableSchedule, now: Date): boolean {
  const displayStatus = normalizeScheduleStatus(schedule.display_status);

  return displayStatus === 'ongoing' || displayStatus === 'completed' || toLocalDateTime(schedule.schedule_date, schedule.start_time) <= now;
}

/**
 * Menentukan tombol yang ditampilkan di detail sesi. API tetap menjadi penentu akhir;
 * fungsi ini mencegah member menekan tombol yang pasti ditolak dan menjelaskan alasannya.
 * `memberships` bernilai null bila riwayat belum diketahui; pemeriksaan membership lalu diserahkan ke API.
 */
export function bookingAvailability(
  schedule: BookableSchedule,
  memberships: readonly MembershipPeriod[] | null,
  now: Date,
): BookingAvailability {
  const started = hasStarted(schedule, now);

  if (schedule.is_booked === true) {
    return started
      ? { action: 'cancel', enabled: false, reason: BOOKING_REASONS.cancelClosed }
      : { action: 'cancel', enabled: true, reason: null };
  }

  if (normalizeScheduleStatus(schedule.status) === 'cancelled') {
    return { action: 'none', enabled: false, reason: BOOKING_REASONS.cancelled };
  }

  if (normalizeScheduleStatus(schedule.status) !== 'scheduled' || started) {
    return { action: 'none', enabled: false, reason: BOOKING_REASONS.started };
  }

  if (memberships !== null && !isMembershipActiveOn(memberships, schedule.schedule_date)) {
    return { action: 'none', enabled: false, reason: BOOKING_REASONS.inactive };
  }

  return { action: 'book', enabled: true };
}
