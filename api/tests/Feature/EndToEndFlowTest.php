<?php

namespace Tests\Feature;

use App\Models\ClassSchedule;
use App\Models\MembershipPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Alur lengkap: member mengajukan, admin menyetujui, periode tampil di daftar member,
 * member booking, counter bertambah, dan admin melihat pesertanya.
 */
class EndToEndFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_application_approval_and_booking_flow(): void
    {
        $plan = MembershipPlan::factory()->create(['name' => '1 Bulan', 'duration_days' => 30]);
        $member = User::factory()->create(['name' => 'Nina Kartika']);
        $admin = User::factory()->admin()->create();
        $schedule = ClassSchedule::factory()->create(['schedule_date' => '2026-11-21']);

        Sanctum::actingAs($member);
        $this->getJson('/api/v1/me')->assertJsonPath('data.membership.status', 'none');
        $this->postJson("/api/v1/member/class-schedules/{$schedule->id}/booking")->assertUnprocessable();
        $this->postJson('/api/v1/member/memberships', [
            'membership_plan_id' => $plan->id,
            'start_date' => '2026-11-20',
            'payment_method' => 'on_the_spot',
        ])->assertCreated();
        $this->getJson('/api/v1/me')->assertJsonPath('data.membership.status', 'pending');

        Sanctum::actingAs($admin);
        $transactionId = $this->getJson('/api/v1/admin/transactions?status=pending')
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.member.id', $member->id)
            ->json('data.0.id');
        $this->postJson("/api/v1/admin/transactions/{$transactionId}/approve")->assertOk();
        $this->getJson('/api/v1/admin/members?status=active')
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $member->id)
            ->assertJsonPath('data.0.plan.name', '1 Bulan')
            ->assertJsonPath('data.0.start_date', '2026-11-20')
            ->assertJsonPath('data.0.end_date', '2026-12-19');

        Sanctum::actingAs($member);
        $this->getJson('/api/v1/me')->assertJsonPath('data.membership.is_active', true);
        $this->postJson("/api/v1/member/class-schedules/{$schedule->id}/booking")
            ->assertOk()
            ->assertJsonPath('data.participants_count', 1)
            ->assertJsonPath('data.is_booked', true);

        Sanctum::actingAs($admin);
        $this->getJson("/api/v1/admin/class-schedules/{$schedule->id}")
            ->assertJsonPath('data.participants_count', 1)
            ->assertJsonPath('data.participants.0.member.name', 'Nina Kartika');
    }
}
