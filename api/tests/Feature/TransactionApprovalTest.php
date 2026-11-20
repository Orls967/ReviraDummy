<?php

namespace Tests\Feature;

use App\Models\Membership;
use App\Models\MembershipPlan;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TransactionApprovalTest extends TestCase
{
    use RefreshDatabase;

    private function pendingTransaction(string $startDate = '2026-11-20', int $days = 30, ?User $member = null): Transaction
    {
        $plan = MembershipPlan::factory()->create(['duration_days' => $days]);
        $membership = Membership::factory()
            ->for($member ?? User::factory()->create())
            ->for($plan, 'plan')
            ->create(['start_date' => $startDate]);

        return Transaction::factory()->for($membership)->create();
    }

    public function test_admin_approval_activates_membership_with_inclusive_period(): void
    {
        $admin = $this->actingAsAdmin();
        $transaction = $this->pendingTransaction('2026-11-20', 30);

        $this->postJson("/api/v1/admin/transactions/{$transaction->id}/approve")
            ->assertOk()
            ->assertJsonPath('data.verification_status', 'verified')
            ->assertJsonPath('data.membership.status', 'active')
            ->assertJsonPath('data.membership.start_date', '2026-11-20')
            ->assertJsonPath('data.membership.end_date', '2026-12-19');

        $this->assertDatabaseHas('transactions', ['id' => $transaction->id, 'verified_by' => $admin->id]);
    }

    public function test_approval_moves_past_start_date_to_today(): void
    {
        $this->actingAsAdmin();
        $transaction = $this->pendingTransaction('2026-11-15', 30);

        $this->postJson("/api/v1/admin/transactions/{$transaction->id}/approve")
            ->assertOk()
            ->assertJsonPath('data.membership.start_date', '2026-11-20')
            ->assertJsonPath('data.membership.end_date', '2026-12-19');
    }

    public function test_approving_twice_is_a_conflict(): void
    {
        $this->actingAsAdmin();
        $transaction = $this->pendingTransaction();

        $this->postJson("/api/v1/admin/transactions/{$transaction->id}/approve")->assertOk();
        $this->postJson("/api/v1/admin/transactions/{$transaction->id}/approve")->assertConflict();
        $this->postJson("/api/v1/admin/transactions/{$transaction->id}/reject", ['reason' => 'Terlambat'])->assertConflict();
    }

    public function test_approval_overlapping_another_active_period_is_a_conflict(): void
    {
        $this->actingAsAdmin();
        $member = User::factory()->create();
        Membership::factory()->for($member)->active(today(), 30)->create();
        $transaction = $this->pendingTransaction('2026-12-01', 30, $member);

        $this->postJson("/api/v1/admin/transactions/{$transaction->id}/approve")->assertConflict();

        $this->assertDatabaseHas('memberships', ['id' => $transaction->membership_id, 'status' => 'pending']);
    }

    public function test_admin_can_reject_with_reason(): void
    {
        $this->actingAsAdmin();
        $transaction = $this->pendingTransaction();

        $this->postJson("/api/v1/admin/transactions/{$transaction->id}/reject", ['reason' => '  Bukti tidak jelas.  '])
            ->assertOk()
            ->assertJsonPath('data.verification_status', 'rejected')
            ->assertJsonPath('data.reject_reason', 'Bukti tidak jelas.')
            ->assertJsonPath('data.membership.status', 'rejected');
    }

    public function test_reject_requires_reason(): void
    {
        $this->actingAsAdmin();
        $transaction = $this->pendingTransaction();

        $this->postJson("/api/v1/admin/transactions/{$transaction->id}/reject", ['reason' => ''])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['reason']);
    }

    public function test_admin_lists_transactions_filtered_by_status_with_pagination_meta(): void
    {
        $this->actingAsAdmin();
        $pending = $this->pendingTransaction();
        $approved = $this->pendingTransaction();
        $this->postJson("/api/v1/admin/transactions/{$approved->id}/approve")->assertOk();

        $this->getJson('/api/v1/admin/transactions?status=pending')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $pending->id)
            ->assertJsonPath('data.0.member.id', $pending->user_id)
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('meta.per_page', 15);

        $this->getJson('/api/v1/admin/transactions?status=lainnya')->assertUnprocessable();
    }

    public function test_transaction_endpoints_require_admin(): void
    {
        $transaction = $this->pendingTransaction();

        $this->postJson("/api/v1/admin/transactions/{$transaction->id}/approve")->assertUnauthorized();

        $this->actingAsMember();
        $this->postJson("/api/v1/admin/transactions/{$transaction->id}/approve")->assertForbidden();
    }
}
