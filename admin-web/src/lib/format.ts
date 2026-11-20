const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
const shortDate = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const longDate = new Intl.DateTimeFormat('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});
const dateTime = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/** Tanggal "YYYY-MM-DD" dibaca sebagai UTC supaya tidak bergeser oleh zona waktu browser. */
function parseIsoDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00Z`);
}

export function formatRupiah(amount: number): string {
  return rupiah.format(amount);
}

export function formatDate(isoDate: string): string {
  return shortDate.format(parseIsoDate(isoDate));
}

export function formatLongDate(isoDate: string): string {
  return longDate.format(parseIsoDate(isoDate));
}

export function formatDateTime(isoDateTime: string): string {
  return dateTime.format(new Date(isoDateTime));
}

export function formatPeriod(start: string | null, end: string | null): string {
  if (start === null) {
    return '—';
  }

  return end === null ? `Mulai ${formatDate(start)}` : `${formatDate(start)} – ${formatDate(end)}`;
}

export function addDays(isoDate: string, days: number): string {
  const date = parseIsoDate(isoDate);
  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
}

/** Tanggal hari ini menurut zona waktu perangkat. */
export function todayIso(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${now.getFullYear()}-${month}-${day}`;
}
