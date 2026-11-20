import { describe, expect, it } from 'vitest';
import { resolveApiBaseUrl } from './config';
import { addDays, daysBetween, formatDate, formatDayChip, formatLongDate, formatPeriod, todayIso } from './dates';
import { buildQueryString, toApiError } from './http';
import { formatRupiah } from './money';

describe('dates', () => {
  it('memformat tanggal dalam bahasa Indonesia', () => {
    expect(formatDate('2026-11-20')).toBe('20 Nov 2026');
    expect(formatLongDate('2026-11-20')).toBe('Jumat, 20 November 2026');
    expect(formatDayChip('2026-11-22')).toEqual({ weekday: 'Min', day: '22', month: 'Nov' });
    expect(formatPeriod('2026-11-20', '2026-12-19')).toBe('20 Nov 2026 – 19 Des 2026');
  });

  it('menghitung tanggal', () => {
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
    expect(daysBetween('2026-11-20', '2026-12-19')).toBe(29);
    expect(todayIso(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
});

describe('money', () => {
  it('memformat rupiah', () => {
    expect(formatRupiah(150000)).toBe('Rp150.000');
    expect(formatRupiah(1400000)).toBe('Rp1.400.000');
    expect(formatRupiah(0)).toBe('Rp0');
  });
});

describe('http helpers', () => {
  it('membangun URL API dan query', () => {
    expect(resolveApiBaseUrl('http://192.168.1.10:8000/')).toBe('http://192.168.1.10:8000/api/v1');
    expect(resolveApiBaseUrl('')).toBeNull();
    expect(buildQueryString({ from: '2026-11-20', to: '', page: 2 })).toBe('?from=2026-11-20&page=2');
  });

  it('menerjemahkan error API', () => {
    const conflict = toApiError(409, { message: 'Anda sudah membooking sesi ini.' });
    const validation = toApiError(422, { message: 'x', errors: { booking: ['Membership Anda tidak aktif pada tanggal sesi ini.'] } });

    expect(conflict.message).toBe('Anda sudah membooking sesi ini.');
    expect(validation.fieldError('booking')).toBe('Membership Anda tidak aktif pada tanggal sesi ini.');
    expect(toApiError(401, { message: 'Unauthenticated.' }).message).toBe('Sesi Anda berakhir. Silakan masuk kembali.');
  });
});
