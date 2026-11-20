const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as const;
const MONTH_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'] as const;

interface DateParts {
  year: number;
  month: number;
  day: number;
}

function parts(isoDate: string): DateParts {
  const [year = 0, month = 1, day = 1] = isoDate.split('-').map(Number);

  return { year, month, day };
}

function toUtc(isoDate: string): Date {
  const { year, month, day } = parts(isoDate);

  return new Date(Date.UTC(year, month - 1, day));
}

function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Tanggal hari ini menurut zona waktu perangkat. */
export function todayIso(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${now.getFullYear()}-${month}-${day}`;
}

export function addDays(isoDate: string, days: number): string {
  const date = toUtc(isoDate);
  date.setUTCDate(date.getUTCDate() + days);

  return toIso(date);
}

export function daysBetween(fromIso: string, toIsoDate: string): number {
  return Math.round((toUtc(toIsoDate).getTime() - toUtc(fromIso).getTime()) / 86_400_000);
}

export function formatDate(isoDate: string): string {
  const { year, month, day } = parts(isoDate);

  return `${day} ${MONTH_NAMES[month - 1]?.slice(0, 3) ?? ''} ${year}`;
}

export function formatLongDate(isoDate: string): string {
  const { year, month, day } = parts(isoDate);
  const weekday = DAY_NAMES[toUtc(isoDate).getUTCDay()] ?? '';

  return `${weekday}, ${day} ${MONTH_NAMES[month - 1] ?? ''} ${year}`;
}

export function formatDayChip(isoDate: string): { weekday: string; day: string; month: string } {
  const { month, day } = parts(isoDate);

  return {
    weekday: (DAY_NAMES[toUtc(isoDate).getUTCDay()] ?? '').slice(0, 3),
    day: String(day),
    month: (MONTH_NAMES[month - 1] ?? '').slice(0, 3),
  };
}

export function formatPeriod(start: string | null, end: string | null): string {
  if (start === null) {
    return '—';
  }

  return end === null ? `Mulai ${formatDate(start)}` : `${formatDate(start)} – ${formatDate(end)}`;
}

/** Waktu lokal perangkat dari tanggal "YYYY-MM-DD" dan jam "HH:MM". */
export function toLocalDateTime(isoDate: string, time: string): Date {
  const { year, month, day } = parts(isoDate);
  const [hours = 0, minutes = 0] = time.split(':').map(Number);

  return new Date(year, month - 1, day, hours, minutes);
}
