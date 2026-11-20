import { formatDuration, formatPeriod, formatRupiah } from '../lib/format';
import { scheduleStatusMeta } from './scheduleStatus';
import type { StatusMeta, Tone } from './tone';

export const AUDIT_ACTIONS = [
  { value: 'transaction.approved', label: 'Transaksi disetujui', tone: 'success' },
  { value: 'transaction.rejected', label: 'Transaksi ditolak', tone: 'danger' },
  { value: 'plan.created', label: 'Paket dibuat', tone: 'info' },
  { value: 'plan.updated', label: 'Paket diubah', tone: 'info' },
  { value: 'plan.deleted', label: 'Paket dihapus', tone: 'danger' },
  { value: 'schedule.created', label: 'Sesi dibuat', tone: 'info' },
  { value: 'schedule.updated', label: 'Sesi diubah', tone: 'info' },
  { value: 'schedule.status_changed', label: 'Status sesi diubah', tone: 'warning' },
  { value: 'schedule.deleted', label: 'Sesi dihapus', tone: 'danger' },
  { value: 'auth.admin_login', label: 'Admin masuk', tone: 'neutral' },
] as const satisfies readonly { value: string; label: string; tone: Tone }[];

const FIELD_LABELS: Readonly<Record<string, string>> = {
  name: 'Nama',
  price: 'Harga',
  duration_days: 'Durasi',
  description: 'Deskripsi',
  is_active: 'Status',
  schedule_date: 'Tanggal',
  start_time: 'Mulai',
  end_time: 'Selesai',
  gym_class_id: 'Kelas',
  instructor_id: 'Instruktur',
};

type Properties = Record<string, unknown>;

function text(properties: Properties, key: string): string | null {
  const value = properties[key];

  return typeof value === 'string' && value !== '' ? value : null;
}

function amount(properties: Properties, key: string): number | null {
  const value = properties[key];

  return typeof value === 'number' ? value : null;
}

function isRecord(value: unknown): value is Properties {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function formatFieldValue(field: string, value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  if (field === 'price' && typeof value === 'number') {
    return formatRupiah(value);
  }

  if (field === 'duration_days' && typeof value === 'number') {
    return formatDuration(value);
  }

  if (field === 'is_active') {
    return value === true || value === 1 ? 'aktif' : 'nonaktif';
  }

  if ((field === 'start_time' || field === 'end_time') && typeof value === 'string') {
    return value.slice(0, 5);
  }

  return String(value);
}

function describeChanges(changes: unknown): string[] {
  if (!isRecord(changes)) {
    return [];
  }

  return Object.entries(changes).map(([field, change]) => {
    const label = FIELD_LABELS[field] ?? field;

    if (field === 'description') {
      return `${label} diperbarui`;
    }

    if (!isRecord(change)) {
      return `${label} diubah`;
    }

    return `${label} ${formatFieldValue(field, change.from)} → ${formatFieldValue(field, change.to)}`;
  });
}

function joinParts(parts: (string | null)[]): string {
  return parts.filter((part): part is string => part !== null && part !== '').join(' · ');
}

function money(properties: Properties): string | null {
  const value = amount(properties, 'amount') ?? amount(properties, 'price');

  return value === null ? null : formatRupiah(value);
}

function slot(properties: Properties): string | null {
  const date = text(properties, 'schedule_date');
  const start = text(properties, 'start_time');

  return date === null ? null : joinParts([date, start ? `pukul ${start.slice(0, 5)}` : null]);
}

export function auditActionMeta(action: string, fallbackLabel: string): StatusMeta {
  const match = AUDIT_ACTIONS.find((item) => item.value === action);

  return { label: match?.label ?? fallbackLabel, tone: match?.tone ?? 'neutral' };
}

/** Ringkasan satu baris dari properties catatan audit; kunci yang tidak dikenal diabaikan. */
export function describeAuditEntry(action: string, properties: Properties): string {
  switch (action) {
    case 'plan.created':
    case 'plan.deleted': {
      const days = amount(properties, 'duration_days');

      return joinParts([text(properties, 'name'), money(properties), days === null ? null : formatDuration(days)]);
    }
    case 'plan.updated':
      return joinParts([text(properties, 'name'), ...describeChanges(properties.changes)]);
    case 'transaction.approved':
      return joinParts([
        text(properties, 'plan'),
        money(properties),
        text(properties, 'start_date') ? `periode ${formatPeriod(text(properties, 'start_date'), text(properties, 'end_date'))}` : null,
      ]);
    case 'transaction.rejected': {
      const reason = text(properties, 'reason');

      return joinParts([text(properties, 'plan'), money(properties), reason ? `alasan: ${reason}` : null]);
    }
    case 'schedule.created':
    case 'schedule.deleted':
      return slot(properties) ?? '';
    case 'schedule.updated':
      return joinParts(describeChanges(properties.changes));
    case 'schedule.status_changed': {
      const from = text(properties, 'from');
      const to = text(properties, 'to');
      const reason = text(properties, 'cancel_reason');

      return joinParts([
        from && to ? `${scheduleStatusMeta(from).label} → ${scheduleStatusMeta(to).label}` : null,
        reason ? `alasan: ${reason}` : null,
      ]);
    }
    case 'auth.admin_login': {
      const device = text(properties, 'device');

      return device ? `Perangkat: ${device}` : '';
    }
    default:
      return '';
  }
}
