import type { MembershipPlan } from '../api/types';
import { formatRupiah } from '../lib/money';

export function planDurationLabel(days: number): string {
  return days === 1 ? '1 hari kunjungan' : `${days} hari`;
}

/** Kalimat utuh untuk pembaca layar, mis. "1 Bulan, 30 hari, Rp500.000". */
export function planAccessibilityLabel(plan: Pick<MembershipPlan, 'name' | 'duration_days' | 'price'>): string {
  return `${plan.name}, ${planDurationLabel(plan.duration_days)}, ${formatRupiah(plan.price)}`;
}
