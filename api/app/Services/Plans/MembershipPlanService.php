<?php

namespace App\Services\Plans;

use App\Enums\AuditAction;
use App\Exceptions\ConflictException;
use App\Models\MembershipPlan;
use App\Models\User;
use App\Services\Audit\AuditLogger;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class MembershipPlanService
{
    private const AUDITED_FIELDS = ['name', 'duration_days', 'price', 'description', 'is_active'];

    public function __construct(private readonly AuditLogger $audit) {}

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
    public function create(array $data, User $actor): MembershipPlan
    {
        return DB::transaction(function () use ($data, $actor) {
            $plan = MembershipPlan::query()->create($data);
            $this->audit->record($actor, AuditAction::PlanCreated, $plan, $plan->only(self::AUDITED_FIELDS));

            return $plan;
        });
    }

    /**
     * @param  array{name: string, duration_days: int, price: int, description?: string|null, is_active?: bool}  $data
     */
    public function update(MembershipPlan $plan, array $data, User $actor): MembershipPlan
    {
        return DB::transaction(function () use ($plan, $data, $actor) {
            $plan->update($data);
            $changes = $this->audit->changes($plan, self::AUDITED_FIELDS);

            if ($changes !== []) {
                $this->audit->record($actor, AuditAction::PlanUpdated, $plan, ['name' => $plan->name, 'changes' => $changes]);
            }

            return $plan;
        });
    }

    /**
     * Paket yang pernah dipakai tetap disimpan supaya riwayat membership tidak rusak.
     *
     * @throws ConflictException bila paket sudah dipakai
     */
    public function delete(MembershipPlan $plan, User $actor): void
    {
        if ($plan->memberships()->exists()) {
            throw new ConflictException('Paket sudah dipakai member sehingga tidak bisa dihapus. Nonaktifkan paket ini sebagai gantinya.');
        }

        DB::transaction(function () use ($plan, $actor) {
            $this->audit->record($actor, AuditAction::PlanDeleted, $plan, $plan->only(['name', 'price', 'duration_days']));
            $plan->delete();
        });
    }
}
