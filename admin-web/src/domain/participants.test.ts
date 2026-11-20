import { participantProgress } from './participants';

describe('participantProgress', () => {
  it('menghitung kekurangan peserta', () => {
    expect(participantProgress(1, 3)).toEqual({
      count: 1,
      minimum: 3,
      isMinimumMet: false,
      missing: 2,
      label: '1 dari minimal 3 peserta',
    });
  });

  it('tidak membatasi jumlah peserta di atas minimum', () => {
    const progress = participantProgress(12, 3);

    expect(progress.isMinimumMet).toBe(true);
    expect(progress.missing).toBe(0);
  });

  it('mengabaikan angka negatif', () => {
    expect(participantProgress(-1, 2).count).toBe(0);
  });
});
