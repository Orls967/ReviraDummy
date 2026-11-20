import { normalizeKey, type StatusMeta } from './tone';

const META: Readonly<Record<string, StatusMeta>> = {
  pending: { label: 'Menunggu', tone: 'warning' },
  verified: { label: 'Disetujui', tone: 'success' },
  rejected: { label: 'Ditolak', tone: 'danger' },
};

const PAYMENT_LABELS: Readonly<Record<string, string>> = {
  transfer: 'Transfer bank',
  on_the_spot: 'Bayar di tempat',
};

export function transactionStatusMeta(value: unknown): StatusMeta {
  return META[normalizeKey(value)] ?? { label: 'Tidak diketahui', tone: 'neutral' };
}

export function isPendingTransaction(value: unknown): boolean {
  return normalizeKey(value) === 'pending';
}

export function paymentMethodLabel(value: unknown): string {
  return PAYMENT_LABELS[normalizeKey(value)] ?? '—';
}
