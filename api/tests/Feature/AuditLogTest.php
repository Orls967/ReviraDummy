<?php

namespace Tests\Feature;

use App\Enums\AuditAction;
use App\Models\AuditLog;
use App\Models\ClassSchedule;
use App\Models\MembershipPlan;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use LogicException;
use Tests\TestCase;

class AuditLogTest extends TestCase
{
    use RefreshDatabase;

    public function test_transaction_approval_is_recorded_with_actor(): void
    {
        $admin = $this->actingAsAdmin();
        $transaction = Transaction::factory()->create();

        $this->postJson("/api/v1/admin/transactions/{$transaction->id}/approve")->assertOk();

        $log = AuditLog::query()->sole();
        $this->assertSame(AuditAction::TransactionApproved, $log->action);
        $this->assertSame($admin->id, $log->actor_id);
        $this->assertSame('transactions', $log->subject_type);
        $this->assertSame($transaction->id, $log->subject_id);
        $this->assertSame($transaction->amount, $log->properties['amount']);
    }

    public function test_plan_update_records_old_and_new_values(): void
    {
        $this->actingAsAdmin();
        $plan = MembershipPlan::factory()->create(['name' => '1 Bulan', 'price' => 450000, 'duration_days' => 30]);

        $this->putJson("/api/v1/admin/membership-plans/{$plan->id}", ['name' => '1 Bulan', 'duration_days' => 30, 'price' => 500000])
            ->assertOk();

        $log = AuditLog::query()->sole();
        $this->assertSame(AuditAction::PlanUpdated, $log->action);
        $this->assertSame(['price' => ['from' => 450000, 'to' => 500000]], $log->properties['changes']);
    }

    public function test_unchanged_plan_save_is_not_logged(): void
    {
        $this->actingAsAdmin();
        $plan = MembershipPlan::factory()->create(['name' => '1 Bulan', 'price' => 500000, 'duration_days' => 30, 'description' => null]);

        $this->putJson("/api/v1/admin/membership-plans/{$plan->id}", ['name' => '1 Bulan', 'duration_days' => 30, 'price' => 500000])
            ->assertOk();

        $this->assertSame(0, AuditLog::query()->count());
    }

    public function test_schedule_cancellation_and_rejection_are_recorded(): void
    {
        $this->actingAsAdmin();
        $schedule = ClassSchedule::factory()->create();
        $transaction = Transaction::factory()->create();

        $this->patchJson("/api/v1/admin/class-schedules/{$schedule->id}/status", ['status' => 'cancelled', 'cancel_reason' => 'Instruktur sakit'])
            ->assertOk();
        $this->postJson("/api/v1/admin/transactions/{$transaction->id}/reject", ['reason' => 'Bukti buram'])->assertOk();

        $this->assertSame(
            [AuditAction::ScheduleStatusChanged, AuditAction::TransactionRejected],
            AuditLog::query()->orderBy('id')->pluck('action')->all(),
        );
        $this->assertSame(
            ['from' => 'scheduled', 'to' => 'cancelled', 'cancel_reason' => 'Instruktur sakit'],
            AuditLog::query()->where('action', 'schedule.status_changed')->sole()->properties,
        );
    }

    public function test_admin_login_is_recorded_without_secrets_but_member_login_is_not(): void
    {
        $admin = User::factory()->admin()->create(['password' => 'rahasia-admin']);
        $member = User::factory()->create(['password' => 'rahasia-member']);

        $this->postJson('/api/v1/login', ['email' => $admin->email, 'password' => 'rahasia-admin'])->assertOk();
        $this->postJson('/api/v1/login', ['email' => $member->email, 'password' => 'rahasia-member'])->assertOk();

        $log = AuditLog::query()->sole();
        $this->assertSame(AuditAction::AdminLoggedIn, $log->action);
        $this->assertStringNotContainsString('rahasia', json_encode($log->properties));
    }

    public function test_failed_admin_action_leaves_no_log(): void
    {
        $this->actingAsAdmin();
        $transaction = Transaction::factory()->create(['verification_status' => 'verified']);

        $this->postJson("/api/v1/admin/transactions/{$transaction->id}/approve")->assertConflict();

        $this->assertSame(0, AuditLog::query()->count());
    }

    public function test_admin_can_list_and_filter_audit_logs_without_ip_addresses(): void
    {
        $this->actingAsAdmin();
        $plan = MembershipPlan::factory()->create();
        $this->deleteJson("/api/v1/admin/membership-plans/{$plan->id}")->assertNoContent();
        $this->postJson('/api/v1/admin/membership-plans', ['name' => 'Paket Baru', 'duration_days' => 7, 'price' => 150000])->assertCreated();

        $this->getJson('/api/v1/admin/audit-logs')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.action', 'plan.created')
            ->assertJsonPath('data.0.action_label', 'Paket dibuat')
            ->assertJsonMissingPath('data.0.ip_address')
            ->assertJsonPath('meta.total', 2);

        $this->getJson('/api/v1/admin/audit-logs?action=plan.deleted')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.properties.name', $plan->name);

        $this->getJson('/api/v1/admin/audit-logs?action=tidak-dikenal')->assertUnprocessable();
    }

    public function test_audit_entries_are_append_only(): void
    {
        $this->actingAsAdmin();
        $plan = MembershipPlan::factory()->create();
        $this->deleteJson("/api/v1/admin/membership-plans/{$plan->id}")->assertNoContent();
        $log = AuditLog::query()->sole();

        $this->expectException(LogicException::class);

        $log->update(['action' => AuditAction::PlanCreated]);
    }
}
