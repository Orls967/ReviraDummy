import { describe, expect, it } from 'vitest';
import { canApplyForMembership, membershipRecordMeta, membershipStatusMeta, normalizeMembershipStatus, suggestedStartDate } from './membershipStatus';
import { participantProgress } from './participants';
import { normalizeScheduleStatus, scheduleStatusMeta } from './scheduleStatus';

describe('normalizeMembershipStatus', () => {
  it.each([
    ['active', 'active'],
    [' PENDING ', 'pending'],
    ['upcoming', 'upcoming'],
    ['expired', 'expired'],
  ])('mengenali %s', (input, expected) => {
    expect(normalizeMembershipStatus(input)).toBe(expected);
  });

  it.each([[null], [undefined], ['rejected'], ['aktif'], [1]])('menganggap %s sebagai none', (input) => {
    expect(normalizeMembershipStatus(input)).toBe('none');
  });

  it('memberi label dan aturan pengajuan', () => {
    expect(membershipStatusMeta('active')).toEqual({ label: 'Aktif', tone: 'success' });
    expect(membershipStatusMeta('none').label).toBe('Belum ada membership');
    expect(membershipRecordMeta('rejected')).toEqual({ label: 'Ditolak', tone: 'danger' });
    expect(canApplyForMembership('pending', true)).toBe(false);
    expect(canApplyForMembership('expired', false)).toBe(true);
    expect(canApplyForMembership('active', false)).toBe(true);
    expect(canApplyForMembership('active', true)).toBe(false);
  });
});

describe('suggestedStartDate', () => {
  it('menyarankan hari setelah membership berjalan berakhir', () => {
    expect(suggestedStartDate('active', '2026-12-09', '2026-11-20')).toBe('2026-12-10');
    expect(suggestedStartDate('upcoming', '2027-01-05', '2026-11-20')).toBe('2027-01-06');
  });

  it('menyarankan hari ini bila tidak ada membership berjalan', () => {
    expect(suggestedStartDate('expired', '2026-11-01', '2026-11-20')).toBe('2026-11-20');
    expect(suggestedStartDate('none', null, '2026-11-20')).toBe('2026-11-20');
  });
});

describe('normalizeScheduleStatus', () => {
  it('memetakan status API ke label Indonesia', () => {
    expect(scheduleStatusMeta('scheduled').label).toBe('Terjadwal');
    expect(scheduleStatusMeta('ongoing').label).toBe('Berlangsung');
    expect(scheduleStatusMeta('completed').label).toBe('Selesai');
    expect(scheduleStatusMeta('Cancelled ').label).toBe('Dibatalkan');
  });

  it('tidak mengenal status penuh karena kelas tidak punya kapasitas maksimum', () => {
    expect(normalizeScheduleStatus('full')).toBe('unknown');
  });
});

describe('participantProgress', () => {
  it('menghitung kekurangan peserta tanpa batas maksimum', () => {
    expect(participantProgress(2, 5)).toMatchObject({ missing: 3, isMinimumMet: false, ratio: 0.4, label: '2 dari minimal 5 peserta' });
    expect(participantProgress(9, 5)).toMatchObject({ missing: 0, isMinimumMet: true, ratio: 1 });
  });
});
