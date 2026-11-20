<?php

namespace Database\Seeders;

use App\Enums\MembershipRecordType;
use App\Enums\MembershipStatus;
use App\Enums\PaymentMethod;
use App\Enums\TransactionStatus;
use App\Models\User;
use App\Services\Plans\StandardPlanCatalog;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;

/**
 * Satu skenario status per member: aktif, kedaluwarsa, pending, ditolak, dan tanpa membership (nina).
 * Member yang sudah punya riwayat membership dilewati supaya seeder aman dijalankan ulang.
 */
class MembershipSeeder extends Seeder
{
    public function run(StandardPlanCatalog $catalog): void
    {
        $today = CarbonImmutable::today();
        $admin = User::query()->where('email', UserSeeder::ADMIN_EMAIL)->firstOrFail();

        $scenarios = [
            ['budi@revira.test', StandardPlanCatalog::MONTHLY, $today->subDays(10), MembershipStatus::Active, PaymentMethod::Transfer, null],
            ['sari@revira.test', StandardPlanCatalog::QUARTERLY, $today->subDays(30), MembershipStatus::Active, PaymentMethod::OnTheSpot, null],
            ['dewi@revira.test', StandardPlanCatalog::MONTHLY, $today->subDays(45), MembershipStatus::Expired, PaymentMethod::OnTheSpot, null],
            ['rudi@revira.test', StandardPlanCatalog::MONTHLY, $today, MembershipStatus::Pending, PaymentMethod::Transfer, null],
            ['putri@revira.test', StandardPlanCatalog::QUARTERLY, $today->addDays(2), MembershipStatus::Pending, PaymentMethod::OnTheSpot, null],
            ['agus@revira.test', StandardPlanCatalog::MONTHLY, $today->subDays(3), MembershipStatus::Rejected, PaymentMethod::Transfer, 'Nominal transfer tidak sesuai harga paket.'],
        ];

        foreach ($scenarios as [$email, $planCode, $startDate, $status, $paymentMethod, $rejectReason]) {
            $member = User::query()->where('email', $email)->firstOrFail();

            if ($member->memberships()->exists()) {
                continue;
            }

            $plan = $catalog->planFor($planCode);
            $isApproved = in_array($status, [MembershipStatus::Active, MembershipStatus::Expired], true);

            $membership = $member->memberships()->create([
                'membership_plan_id' => $plan->id,
                'record_type' => MembershipRecordType::Registration,
                'start_date' => $startDate->toDateString(),
                'end_date' => $isApproved ? $startDate->addDays($plan->duration_days - 1)->toDateString() : null,
                'status' => $status,
            ]);

            $membership->transaction()->create([
                'user_id' => $member->id,
                'amount' => $plan->price,
                'payment_method' => $paymentMethod,
                'verification_status' => match ($status) {
                    MembershipStatus::Active, MembershipStatus::Expired => TransactionStatus::Verified,
                    MembershipStatus::Rejected => TransactionStatus::Rejected,
                    MembershipStatus::Pending => TransactionStatus::Pending,
                },
                'verified_by' => $status === MembershipStatus::Pending ? null : $admin->id,
                'verified_at' => $status === MembershipStatus::Pending ? null : $startDate->setTime(10, 0),
                'reject_reason' => $rejectReason,
            ]);
        }
    }
}
