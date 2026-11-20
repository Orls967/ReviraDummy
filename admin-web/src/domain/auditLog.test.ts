import { auditActionMeta, describeAuditEntry } from './auditLog';

describe('auditLog', () => {
  it('meringkas perubahan harga paket', () => {
    expect(
      describeAuditEntry('plan.updated', {
        name: '1 Bulan',
        changes: { price: { from: 450000, to: 500000 }, duration_days: { from: 31, to: 30 }, description: { from: 'a', to: 'b' } },
      }),
    ).toBe('1 Bulan · Harga Rp450.000 → Rp500.000 · Durasi 31 hari → 30 hari · Deskripsi diperbarui');
  });

  it('meringkas persetujuan dan penolakan transaksi', () => {
    expect(
      describeAuditEntry('transaction.approved', { plan: 'Per Datang', amount: 75000, start_date: '2026-11-20', end_date: '2026-11-20' }),
    ).toBe('Per Datang · Rp75.000 · periode 20 Nov 2026');
    expect(describeAuditEntry('transaction.rejected', { plan: '3 Bulan', amount: 1050000, reason: 'Bukti buram' })).toBe(
      '3 Bulan · Rp1.050.000 · alasan: Bukti buram',
    );
  });

  it('meringkas perubahan status sesi', () => {
    expect(describeAuditEntry('schedule.status_changed', { from: 'scheduled', to: 'cancelled', cancel_reason: 'Hujan' })).toBe(
      'Terjadwal → Dibatalkan · alasan: Hujan',
    );
  });

  it('tahan terhadap properties yang kosong atau tidak dikenal', () => {
    expect(describeAuditEntry('plan.updated', { changes: 'rusak' })).toBe('');
    expect(describeAuditEntry('aksi.baru', { apa: 1 })).toBe('');
  });

  it('memberi label dan warna untuk aksi', () => {
    expect(auditActionMeta('transaction.rejected', 'x')).toEqual({ label: 'Transaksi ditolak', tone: 'danger' });
    expect(auditActionMeta('aksi.baru', 'Aksi baru')).toEqual({ label: 'Aksi baru', tone: 'neutral' });
  });
});
