import { addDays } from '../lib/dates';
import { normalizeKey, type StatusMeta } from './tone';

export const MEMBERSHIP_STATUSES = ['active', 'pending', 'upcoming', 'expired', 'none'] as const;

export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

const META: Readonly<Record<MembershipStatus, StatusMeta>> = {
  active: { label: 'Aktif', tone: 'success' },
  pending: { label: 'Menunggu verifikasi', tone: 'warning' },
  upcoming: { label: 'Akan aktif', tone: 'info' },
  expired: { label: 'Kedaluwarsa', tone: 'danger' },
  none: { label: 'Belum ada membership', tone: 'neutral' },
};

/**
 * Nilai yang tidak dikenal diperlakukan sebagai "none" agar tombol booking tidak pernah aktif karena data aneh.
 */
export function normalizeMembershipStatus(value: unknown): MembershipStatus {
  const key = normalizeKey(value);

  return (MEMBERSHIP_STATUSES as readonly string[]).includes(key) ? (key as MembershipStatus) : 'none';
}

export function membershipStatusMeta(value: unknown): StatusMeta {
  return META[normalizeMembershipStatus(value)];
}

/** Status satu baris riwayat membership (bukan status terkini). */
export function membershipRecordMeta(value: unknown): StatusMeta {
  switch (normalizeKey(value)) {
    case 'active':
      return { label: 'Disetujui', tone: 'success' };
    case 'pending':
      return { label: 'Menunggu verifikasi', tone: 'warning' };
    case 'expired':
      return { label: 'Berakhir', tone: 'neutral' };
    case 'rejected':
      return { label: 'Ditolak', tone: 'danger' };
    default:
      return { label: 'Tidak diketahui', tone: 'neutral' };
  }
}

/**
 * API menolak pengajuan baru selama masih ada yang menunggu verifikasi, termasuk perpanjangan
 * yang diajukan saat membership masih aktif (status terkini tetap "active").
 */
export function canApplyForMembership(value: unknown, hasPendingApplication: boolean): boolean {
  return normalizeMembershipStatus(value) !== 'pending' && !hasPendingApplication;
}

/**
 * Tanggal mulai yang disarankan untuk pengajuan: hari setelah membership berjalan berakhir
 * (agar tidak bertabrakan), atau hari ini bila tidak ada membership berjalan.
 */
export function suggestedStartDate(status: unknown, endDate: string | null, today: string): string {
  const current = normalizeMembershipStatus(status);
  const nextDay = endDate === null ? null : addDays(endDate, 1);

  return (current === 'active' || current === 'upcoming') && nextDay !== null && nextDay > today ? nextDay : today;
}
