<?php

namespace Database\Factories;

use App\Enums\MembershipRecordType;
use App\Enums\MembershipStatus;
use App\Models\Membership;
use App\Models\MembershipPlan;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Membership>
 */
class MembershipFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'membership_plan_id' => MembershipPlan::factory(),
            'record_type' => MembershipRecordType::Registration,
            'start_date' => today(),
            'end_date' => null,
            'status' => MembershipStatus::Pending,
        ];
    }

    /**
     * Membership disetujui dengan periode inklusif start..start+days-1.
     */
    public function active(?CarbonInterface $start = null, int $days = 30): static
    {
        $start ??= today();

        return $this->state(fn () => [
            'status' => MembershipStatus::Active,
            'start_date' => $start->toDateString(),
            'end_date' => $start->copy()->addDays($days - 1)->toDateString(),
        ]);
    }

    public function expired(?CarbonInterface $end = null, int $days = 30): static
    {
        $end ??= today()->subDay();

        return $this->state(fn () => [
            'status' => MembershipStatus::Expired,
            'start_date' => $end->copy()->subDays($days - 1)->toDateString(),
            'end_date' => $end->toDateString(),
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn () => ['status' => MembershipStatus::Rejected]);
    }
}
