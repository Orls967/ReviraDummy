<?php

namespace Tests\Feature;

use App\Models\Membership;
use App\Models\MembershipPlan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MembershipApplicationTest extends TestCase
{
    use RefreshDatabase;

    public function test_member_can_apply_for_membership(): void
    {
        $plan = MembershipPlan::factory()->create(['price' => 150000]);
        $member = $this->actingAsMember();

        $this->postJson('/api/v1/member/memberships', [
            'membership_plan_id' => $plan->id,
            'start_date' => '2026-11-21',
            'payment_method' => 'transfer',
        ])
            ->assertCreated()
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.record_type', 'registration')
            ->assertJsonPath('data.start_date', '2026-11-21')
            ->assertJsonPath('data.end_date', null)
            ->assertJsonPath('data.plan.id', $plan->id)
            ->assertJsonPath('data.transaction.amount', 150000)
            ->assertJsonPath('data.transaction.payment_method', 'transfer')
            ->assertJsonPath('data.transaction.verification_status', 'pending');

        $this->assertDatabaseHas('transactions', ['user_id' => $member->id, 'amount' => 150000, 'verification_status' => 'pending']);
    }

    public function test_second_application_while_pending_is_rejected(): void
    {
        $plan = MembershipPlan::factory()->create();
        $member = $this->actingAsMember();
        Membership::factory()->for($member)->for($plan, 'plan')->create();

        $this->postJson('/api/v1/member/memberships', [
            'membership_plan_id' => $plan->id,
            'start_date' => '2026-11-20',
            'payment_method' => 'on_the_spot',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['membership']);
    }

    public function test_application_overlapping_active_period_is_rejected(): void
    {
        $plan = MembershipPlan::factory()->create(['duration_days' => 30]);
        $member = $this->actingAsMember();
        Membership::factory()->for($member)->for($plan, 'plan')->active(today()->subDays(10))->create();

        $this->postJson('/api/v1/member/memberships', [
            'membership_plan_id' => $plan->id,
            'start_date' => '2026-12-09',
            'payment_method' => 'on_the_spot',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['start_date']);
    }

    public function test_extension_after_active_period_is_accepted(): void
    {
        $plan = MembershipPlan::factory()->create(['duration_days' => 30]);
        $member = $this->actingAsMember();
        Membership::factory()->for($member)->for($plan, 'plan')->active(today()->subDays(10))->create();

        $this->postJson('/api/v1/member/memberships', [
            'membership_plan_id' => $plan->id,
            'start_date' => '2026-12-10',
            'payment_method' => 'on_the_spot',
        ])
            ->assertCreated()
            ->assertJsonPath('data.record_type', 'extension');
    }

    public function test_application_validates_input(): void
    {
        $inactivePlan = MembershipPlan::factory()->inactive()->create();
        $this->actingAsMember();

        $this->postJson('/api/v1/member/memberships', [
            'membership_plan_id' => $inactivePlan->id,
            'start_date' => '2026-11-19',
            'payment_method' => 'kartu_kredit',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'membership_plan_id',
                'start_date' => 'Tanggal mulai tidak boleh sebelum hari ini.',
                'payment_method',
            ]);
    }

    public function test_member_sees_own_history_only(): void
    {
        $member = $this->actingAsMember();
        Membership::factory()->for($member)->expired()->create();
        Membership::factory()->create();

        $this->getJson('/api/v1/member/memberships')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.status', 'expired');
    }

    public function test_application_requires_member_role(): void
    {
        $this->postJson('/api/v1/member/memberships', [])->assertUnauthorized();

        $this->actingAsAdmin();
        $this->postJson('/api/v1/member/memberships', [])->assertForbidden();
    }
}
