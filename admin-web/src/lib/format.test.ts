import { addDays, formatDuration, formatPeriod, formatRupiah, todayIso } from './format';

describe('format', () => {
  it('memformat rupiah tanpa desimal', () => {
    expect(formatRupiah(75000)).toBe('Rp75.000');
    expect(formatRupiah(500000)).toBe('Rp500.000');
    expect(formatRupiah(1050000)).toBe('Rp1.050.000');
    expect(formatRupiah(3075000)).toBe('Rp3.075.000');
    expect(formatRupiah(0)).toBe('Rp0');
  });

  it('memformat durasi paket', () => {
    expect(formatDuration(1)).toBe('1 hari');
    expect(formatDuration(365)).toBe('365 hari');
  });

  it('menambah hari melewati batas bulan', () => {
    expect(addDays('2026-11-28', 7)).toBe('2026-12-05');
  });

  it('memformat periode membership', () => {
    expect(formatPeriod(null, null)).toBe('—');
    expect(formatPeriod('2026-11-20', null)).toBe('Mulai 20 Nov 2026');
    expect(formatPeriod('2026-11-20', '2026-12-19')).toBe('20 Nov 2026 – 19 Des 2026');
    expect(formatPeriod('2026-11-20', '2026-11-20')).toBe('20 Nov 2026');
  });

  it('memakai tanggal lokal perangkat', () => {
    expect(todayIso(new Date(2026, 10, 5, 23, 30))).toBe('2026-11-05');
  });
});
