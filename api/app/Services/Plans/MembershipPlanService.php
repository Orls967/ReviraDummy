<?php

namespace App\Services\Plans;

use App\Exceptions\ConflictException;
use App\Models\MembershipPlan;
use Illuminate\Database\Eloquent\Collection;

class MembershipPlanService
{
    /**
     * @return Collection<int, MembershipPlan>
     */
    public function activePlans(): Collection
    {
        return MembershipPlan::query()->active()->orderBy('price')->orderBy('id')->get();
    }

    /**
     * @return Collection<int, MembershipPlan>
     */
    public function allPlans(): Collection
    {
        return MembershipPlan::query()->orderByDesc('is_active')->orderBy('price')->orderBy('id')->get();
    }

    /**
     * @param  array{name: string, duration_days: int, price: int, description?: string|null, is_active?: bool}  $data
     */
    public function create(array $data): MembershipPlan
    {
        return MembershipPlan::query()->create($data);
    }

    /**
     * @param  array{name: string, duration_days: int, price: int, description?: string|null, is_active?: bool}  $data
     */
    public function update(MembershipPlan $plan, array $data): MembershipPlan
    {
        $plan->update($data);

        return $plan;
    }

    /**
     * Paket yang pernah dipakai tetap disimpan supaya riwayat membership tidak rusak.
     *
     * @throws ConflictException bila paket sudah dipakai
     */
    public function delete(MembershipPlan $plan): void
    {
        if ($plan->memberships()->exists()) {
            throw new ConflictException('Paket sudah dipakai member sehingga tidak bisa dihapus. Nonaktifkan paket ini sebagai gantinya.');
        }

        $plan->delete();
    }
}
