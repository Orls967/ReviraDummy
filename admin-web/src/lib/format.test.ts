import { addDays, formatPeriod, formatRupiah, todayIso } from './format';

describe('format', () => {
  it('memformat rupiah tanpa desimal', () => {
    expect(formatRupiah(150000).replace(/\s/g, ' ')).toBe('Rp 150.000');
  });

  it('menambah hari melewati batas bulan', () => {
    expect(addDays('2026-11-28', 7)).toBe('2026-12-05');
  });

  it('memformat periode membership', () => {
    expect(formatPeriod(null, null)).toBe('—');
    expect(formatPeriod('2026-11-20', null)).toBe('Mulai 20 Nov 2026');
    expect(formatPeriod('2026-11-20', '2026-12-19')).toBe('20 Nov 2026 – 19 Des 2026');
  });

  it('memakai tanggal lokal perangkat', () => {
    expect(todayIso(new Date(2026, 10, 5, 23, 30))).toBe('2026-11-05');
  });
});
