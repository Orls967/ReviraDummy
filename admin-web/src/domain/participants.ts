export interface ParticipantProgress {
  count: number;
  minimum: number;
  isMinimumMet: boolean;
  missing: number;
  label: string;
}

/**
 * Kelas tidak punya kapasitas maksimum; yang dipantau hanya apakah minimum peserta sudah terpenuhi.
 */
export function participantProgress(count: number, minimum: number): ParticipantProgress {
  const safeCount = Math.max(0, count);
  const safeMinimum = Math.max(0, minimum);
  const missing = Math.max(0, safeMinimum - safeCount);

  return {
    count: safeCount,
    minimum: safeMinimum,
    isMinimumMet: missing === 0,
    missing,
    label: `${safeCount} dari minimal ${safeMinimum} peserta`,
  };
}
