import { describe, expect, it } from 'vitest';
import { planAccessibilityLabel, planDurationLabel } from './plans';

describe('plans', () => {
  it('memberi label durasi yang mudah dibaca', () => {
    expect(planDurationLabel(1)).toBe('1 hari kunjungan');
    expect(planDurationLabel(30)).toBe('30 hari');
    expect(planDurationLabel(365)).toBe('365 hari');
  });

  it('menyusun label pembaca layar dengan harga rupiah', () => {
    expect(planAccessibilityLabel({ name: 'Per Datang', duration_days: 1, price: 75000 })).toBe('Per Datang, 1 hari kunjungan, Rp75.000');
    expect(planAccessibilityLabel({ name: '3 Bulan', duration_days: 90, price: 1050000 })).toBe('3 Bulan, 90 hari, Rp1.050.000');
  });
});
