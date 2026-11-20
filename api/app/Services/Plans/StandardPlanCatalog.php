<?php

namespace App\Services\Plans;

use App\Models\MembershipPlan;
use Illuminate\Support\Facades\DB;

/**
 * Menyalin katalog paket standar (config membership.standard_plans) ke tabel membership_plans.
 * Transaksi lama tidak disentuh: nominal yang sudah tercatat tetap sesuai harga saat pengajuan.
 */
class StandardPlanCatalog
{
    public const PER_VISIT = 'per_visit';

    public const MONTHLY = 'monthly';

    public const QUARTERLY = 'quarterly';

    public const YEARLY = 'yearly';

    /**
     * @return array<string, array{name: string, duration_days: int, price: int, description: string, legacy_name: string|null}>
     */
    public function definitions(): array
    {
        return config('membership.standard_plans');
    }

    public function sync(): void
    {
        DB::transaction(function () {
            foreach ($this->definitions() as $code => $definition) {
                $plan = $this->find($code, $definition['legacy_name']) ?? new MembershipPlan;

                $plan->forceFill([
                    'code' => $code,
                    'name' => $definition['name'],
                    'duration_days' => $definition['duration_days'],
                    'price' => $definition['price'],
                    'description' => $definition['description'],
                    'is_active' => true,
                ])->save();
            }
        });
    }

    /**
     * Basis data kosong (instalasi baru atau pengujian) diisi lewat seeder, bukan migrasi.
     */
    public function hasStandardPlans(): bool
    {
        $legacyNames = array_filter(array_column($this->definitions(), 'legacy_name'));

        return MembershipPlan::query()
            ->whereNotNull('code')
            ->orWhereIn('name', $legacyNames)
            ->exists();
    }

    public function planFor(string $code): MembershipPlan
    {
        return MembershipPlan::query()->where('code', $code)->firstOrFail();
    }

    private function find(string $code, ?string $legacyName): ?MembershipPlan
    {
        $plan = MembershipPlan::query()->where('code', $code)->first();

        if ($plan !== null || $legacyName === null) {
            return $plan;
        }

        return MembershipPlan::query()->whereNull('code')->where('name', $legacyName)->orderBy('id')->first();
    }
}
