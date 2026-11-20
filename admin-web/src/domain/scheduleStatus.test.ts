import { normalizeScheduleStatus, scheduleActions, scheduleStatusMeta } from './scheduleStatus';

describe('normalizeScheduleStatus', () => {
  it('mengenali status dari API tanpa peduli huruf besar dan spasi', () => {
    expect(normalizeScheduleStatus(' Ongoing ')).toBe('ongoing');
    expect(normalizeScheduleStatus('cancelled')).toBe('cancelled');
  });

  it('tidak memunculkan status penuh karena kelas tidak punya kapasitas maksimum', () => {
    expect(normalizeScheduleStatus('full')).toBe('unknown');
  });

  it('memberi label bahasa Indonesia', () => {
    expect(scheduleStatusMeta('scheduled').label).toBe('Terjadwal');
    expect(scheduleStatusMeta('ongoing').label).toBe('Berlangsung');
    expect(scheduleStatusMeta('completed').label).toBe('Selesai');
    expect(scheduleStatusMeta('cancelled').label).toBe('Dibatalkan');
  });
});

describe('scheduleActions', () => {
  it('sesi terjadwal yang belum mulai bisa diubah, dimulai, diselesaikan, dan dibatalkan', () => {
    expect(scheduleActions('scheduled', 'scheduled')).toEqual({
      canEdit: true,
      canStart: true,
      canComplete: true,
      canCancel: true,
    });
  });

  it('sesi yang sudah lewat jam mulai tidak bisa diubah jadwalnya', () => {
    expect(scheduleActions('scheduled', 'ongoing').canEdit).toBe(false);
  });

  it('sesi yang sudah lewat jam selesai tidak bisa dimulai', () => {
    expect(scheduleActions('scheduled', 'completed').canStart).toBe(false);
  });

  it('sesi selesai atau batal tidak punya aksi', () => {
    expect(scheduleActions('cancelled', 'cancelled')).toEqual({
      canEdit: false,
      canStart: false,
      canComplete: false,
      canCancel: false,
    });
    expect(scheduleActions('completed', 'completed').canCancel).toBe(false);
  });
});
