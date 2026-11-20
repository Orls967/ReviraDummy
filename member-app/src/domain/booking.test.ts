import { describe, expect, it } from 'vitest';
import { BOOKING_REASONS, bookingAvailability, isMembershipActiveOn, type BookableSchedule, type MembershipPeriod } from './booking';

const NOW = new Date(2026, 10, 20, 9, 0);

const activeMembership: MembershipPeriod = { status: 'active', start_date: '2026-11-10', end_date: '2026-12-09' };

function schedule(overrides: Partial<BookableSchedule> = {}): BookableSchedule {
  return {
    status: 'scheduled',
    display_status: 'scheduled',
    schedule_date: '2026-11-21',
    start_time: '07:00',
    is_booked: false,
    ...overrides,
  };
}

describe('isMembershipActiveOn', () => {
  it('menganggap tanggal awal dan akhir periode masih aktif', () => {
    expect(isMembershipActiveOn([activeMembership], '2026-11-10')).toBe(true);
    expect(isMembershipActiveOn([activeMembership], '2026-12-09')).toBe(true);
    expect(isMembershipActiveOn([activeMembership], '2026-12-10')).toBe(false);
  });

  it('mengabaikan membership yang belum disetujui atau ditolak', () => {
    const pending: MembershipPeriod = { status: 'pending', start_date: '2026-11-20', end_date: null };
    const rejected: MembershipPeriod = { status: 'rejected', start_date: '2026-11-20', end_date: '2026-12-19' };

    expect(isMembershipActiveOn([pending, rejected], '2026-11-21')).toBe(false);
  });

  it('memakai perpanjangan yang sudah disetujui untuk tanggal setelah periode berjalan', () => {
    const extension: MembershipPeriod = { status: 'active', start_date: '2026-12-10', end_date: '2027-01-08' };

    expect(isMembershipActiveOn([activeMembership, extension], '2026-12-20')).toBe(true);
  });
});

describe('bookingAvailability', () => {
  it('mengizinkan booking untuk member aktif pada sesi terjadwal', () => {
    expect(bookingAvailability(schedule(), [activeMembership], NOW)).toEqual({ action: 'book', enabled: true });
  });

  it('menolak bila membership tidak aktif pada tanggal sesi', () => {
    expect(bookingAvailability(schedule({ schedule_date: '2026-12-15' }), [activeMembership], NOW)).toEqual({
      action: 'none',
      enabled: false,
      reason: BOOKING_REASONS.inactive,
    });
    expect(bookingAvailability(schedule(), [], NOW)).toMatchObject({ reason: BOOKING_REASONS.inactive });
  });

  it('menyerahkan pemeriksaan membership ke API bila riwayat belum diketahui', () => {
    expect(bookingAvailability(schedule(), null, NOW)).toEqual({ action: 'book', enabled: true });
  });

  it('menolak sesi yang dibatalkan', () => {
    expect(bookingAvailability(schedule({ status: 'cancelled', display_status: 'cancelled' }), [activeMembership], NOW)).toMatchObject({
      action: 'none',
      reason: BOOKING_REASONS.cancelled,
    });
  });

  it('menolak sesi yang sudah dimulai meskipun status tersimpan masih terjadwal', () => {
    const started = schedule({ schedule_date: '2026-11-20', start_time: '08:30' });

    expect(bookingAvailability(started, [activeMembership], NOW)).toMatchObject({ action: 'none', reason: BOOKING_REASONS.started });
    expect(bookingAvailability(schedule({ display_status: 'ongoing' }), [activeMembership], NOW)).toMatchObject({
      reason: BOOKING_REASONS.started,
    });
  });

  it('menawarkan pembatalan untuk sesi yang sudah dibooking dan belum mulai', () => {
    expect(bookingAvailability(schedule({ is_booked: true }), [activeMembership], NOW)).toEqual({
      action: 'cancel',
      enabled: true,
      reason: null,
    });
  });

  it('mengunci pembatalan setelah sesi dimulai', () => {
    const started = schedule({ is_booked: true, schedule_date: '2026-11-20', start_time: '08:00' });

    expect(bookingAvailability(started, [activeMembership], NOW)).toEqual({
      action: 'cancel',
      enabled: false,
      reason: BOOKING_REASONS.cancelClosed,
    });
  });

  it('tetap menampilkan status booking walau sesi yang dibooking kemudian dibatalkan gym', () => {
    const cancelledBooked = schedule({ is_booked: true, status: 'cancelled', display_status: 'cancelled' });

    expect(bookingAvailability(cancelledBooked, [activeMembership], NOW).action).toBe('cancel');
  });
});
