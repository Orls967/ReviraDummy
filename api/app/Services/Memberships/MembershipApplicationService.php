<?php

namespace App\Services\Memberships;

use App\Enums\MembershipRecordType;
use App\Enums\MembershipStatus;
use App\Enums\PaymentMethod;
use App\Enums\TransactionStatus;
use App\Models\Membership;
use App\Models\MembershipPlan;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class MembershipApplicationService
{
    /**
     * @return Collection<int, Membership>
     */
    public function history(User $user): Collection
    {
        return $user->memberships()
            ->with(['plan', 'transaction'])
            ->latest('id')
            ->get();
    }

    /**
     * Ajukan membership baru atau perpanjangan. Periode final ditetapkan saat admin menyetujui.
     *
     * @throws ValidationException bila masih ada pengajuan pending atau periode bertabrakan
     */
    public function submit(User $user, MembershipPlan $plan, CarbonImmutable $startDate, PaymentMethod $paymentMethod): Membership
    {
        return DB::transaction(function () use ($user, $plan, $startDate, $paymentMethod) {
            // Mengunci baris user menyerialkan pengajuan bersamaan dari member yang sama.
            User::query()->whereKey($user->id)->lockForUpdate()->first();

            if ($user->memberships()->pending()->exists()) {
                throw ValidationException::withMessages([
                    'membership' => 'Masih ada pengajuan yang menunggu verifikasi admin.',
                ]);
            }

            $endDate = $startDate->addDays($plan->duration_days - 1);

            $overlapping = $user->memberships()
                ->overlappingActive($startDate, $endDate)
                ->orderByDesc('end_date')
                ->first();

            if ($overlapping !== null) {
                throw ValidationException::withMessages([
                    'start_date' => 'Periode bertabrakan dengan membership aktif yang berakhir '
                        .$overlapping->end_date->toDateString().'. Pilih tanggal mulai setelahnya.',
                ]);
            }

            $membership = $user->memberships()->create([
                'membership_plan_id' => $plan->id,
                'record_type' => $this->recordTypeFor($user),
                'start_date' => $startDate->toDateString(),
                'status' => MembershipStatus::Pending,
            ]);

            $membership->transaction()->create([
                'user_id' => $user->id,
                'amount' => $plan->price,
                'payment_method' => $paymentMethod,
                'verification_status' => TransactionStatus::Pending,
            ]);

            return $membership->load(['plan', 'transaction']);
        });
    }

    private function recordTypeFor(User $user): MembershipRecordType
    {
        $hasApprovedBefore = $user->memberships()
            ->whereIn('status', [MembershipStatus::Active->value, MembershipStatus::Expired->value])
            ->exists();

        return $hasApprovedBefore ? MembershipRecordType::Extension : MembershipRecordType::Registration;
    }
}
