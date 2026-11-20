import { normalizeKey, type StatusMeta } from './tone';

export const MEMBERSHIP_STATUSES = ['active', 'pending', 'upcoming', 'expired', 'none'] as const;

export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

const META: Readonly<Record<MembershipStatus, StatusMeta>> = {
  active: { label: 'Aktif', tone: 'success' },
  pending: { label: 'Menunggu verifikasi', tone: 'warning' },
  upcoming: { label: 'Akan aktif', tone: 'info' },
  expired: { label: 'Kedaluwarsa', tone: 'danger' },
  none: { label: 'Belum ada', tone: 'neutral' },
};

function isMembershipStatus(value: string): value is MembershipStatus {
  return (MEMBERSHIP_STATUSES as readonly string[]).includes(value);
}

/**
 * Nilai yang tidak dikenal diperlakukan sebagai "none" agar tidak pernah tampil sebagai member aktif.
 */
export function normalizeMembershipStatus(value: unknown): MembershipStatus {
  const key = normalizeKey(value);

  return isMembershipStatus(key) ? key : 'none';
}

export function membershipStatusMeta(value: unknown): StatusMeta {
  return META[normalizeMembershipStatus(value)];
}
