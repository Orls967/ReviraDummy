<?php

namespace Tests\Feature;

use App\Models\ClassParticipant;
use App\Models\ClassSchedule;
use App\Models\Membership;
use App\Models\MembershipPlan;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\PersonalAccessToken;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_is_rate_limited_per_account_with_indonesian_message(): void
    {
        $member = User::factory()->create();

        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->postJson('/api/v1/login', ['email' => $member->email, 'password' => 'salah-'.$attempt])->assertUnprocessable();
        }

        $this->postJson('/api/v1/login', ['email' => $member->email, 'password' => 'salah-lagi'])
            ->assertTooManyRequests()
            ->assertHeader('Retry-After')
            ->assertJsonPath('message', 'Terlalu banyak permintaan. Coba lagi dalam beberapa saat.');
    }

    public function test_unknown_email_and_wrong_password_get_the_same_answer(): void
    {
        $member = User::factory()->create();

        $unknown = $this->postJson('/api/v1/login', ['email' => 'tidak-ada@revira.test', 'password' => 'apa-saja'])->assertUnprocessable();
        $wrong = $this->postJson('/api/v1/login', ['email' => $member->email, 'password' => 'apa-saja'])->assertUnprocessable();

        $this->assertSame($unknown->json(), $wrong->json());
    }

    public function test_admin_token_expires_sooner_than_member_token(): void
    {
        $admin = User::factory()->admin()->create(['password' => 'rahasia-admin']);
        $member = User::factory()->create(['password' => 'rahasia-member']);

        $adminLogin = $this->postJson('/api/v1/login', ['email' => $admin->email, 'password' => 'rahasia-admin'])->assertOk();
        $memberLogin = $this->postJson('/api/v1/login', ['email' => $member->email, 'password' => 'rahasia-member'])->assertOk();

        $this->assertSame(now()->addMinutes(480)->toIso8601String(), $adminLogin->json('data.expires_at'));
        $this->assertSame(now()->addMinutes(43200)->toIso8601String(), $memberLogin->json('data.expires_at'));
        $this->assertStringContainsString('|revira_', $adminLogin->json('data.token'));

        $this->travel(481)->minutes();
        $this->app['auth']->forgetGuards();

        $this->withToken($adminLogin->json('data.token'))->getJson('/api/v1/me')->assertUnauthorized();
        $this->app['auth']->forgetGuards();
        $this->withToken($memberLogin->json('data.token'))->getJson('/api/v1/me')->assertOk();
    }

    public function test_expired_tokens_are_pruned_on_next_login(): void
    {
        $member = User::factory()->create(['password' => 'rahasia-member']);
        $member->createToken('lama', ['*'], now()->subMinute());

        $this->postJson('/api/v1/login', ['email' => $member->email, 'password' => 'rahasia-member'])->assertOk();

        $this->assertSame(1, PersonalAccessToken::query()->count());
    }

    public function test_api_responses_carry_security_headers(): void
    {
        $this->getJson('/api/v1/health')
            ->assertOk()
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('X-Frame-Options', 'DENY')
            ->assertHeader('Referrer-Policy', 'no-referrer')
            ->assertHeader('Cache-Control', 'no-store, private');
    }

    public function test_cors_only_allows_configured_origins(): void
    {
        config(['cors.allowed_origins' => ['http://localhost:5173', 'http://localhost:8081']]);

        $this->withHeaders(['Origin' => 'http://localhost:5173'])->getJson('/api/v1/health')
            ->assertHeader('Access-Control-Allow-Origin', 'http://localhost:5173');

        $this->withHeaders(['Origin' => 'https://situs-lain.example'])->getJson('/api/v1/health')
            ->assertHeaderMissing('Access-Control-Allow-Origin');
    }

    public function test_member_cannot_cancel_another_members_booking(): void
    {
        $owner = User::factory()->create();
        $schedule = ClassSchedule::factory()->create();
        ClassParticipant::factory()->for($schedule, 'schedule')->for($owner)->create();

        $intruder = User::factory()->create();
        Membership::factory()->for($intruder)->active(today(), 30)->create();
        $this->actingAsMember($intruder);

        $this->deleteJson("/api/v1/member/class-schedules/{$schedule->id}/booking")->assertNotFound();

        $this->assertDatabaseHas('class_participants', ['user_id' => $owner->id, 'status' => 'booked']);
    }

    public function test_member_only_sees_own_memberships_and_bookings(): void
    {
        $other = User::factory()->create();
        Membership::factory()->for($other)->active(today(), 30)->create();
        ClassParticipant::factory()->for($other)->create();

        $this->actingAsMember();

        $this->getJson('/api/v1/member/memberships')->assertOk()->assertJsonCount(0, 'data');
        $this->getJson('/api/v1/member/bookings')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_member_schedule_detail_does_not_expose_participant_names(): void
    {
        $schedule = ClassSchedule::factory()->create();
        ClassParticipant::factory()->for($schedule, 'schedule')->create();
        $this->actingAsMember();

        $this->getJson("/api/v1/member/class-schedules/{$schedule->id}")
            ->assertOk()
            ->assertJsonPath('data.participants_count', 1)
            ->assertJsonMissingPath('data.participants');
    }

    public function test_member_cannot_reach_admin_endpoints_even_by_guessing_ids(): void
    {
        $transaction = Transaction::factory()->create();
        $this->actingAsMember();

        $this->getJson('/api/v1/admin/audit-logs')->assertForbidden();
        $this->getJson('/api/v1/admin/members')->assertForbidden();
        $this->postJson("/api/v1/admin/transactions/{$transaction->id}/approve")->assertForbidden();

        $this->assertDatabaseHas('transactions', ['id' => $transaction->id, 'verification_status' => 'pending']);
    }

    public function test_admin_cannot_use_member_endpoints(): void
    {
        $this->actingAsAdmin();
        $plan = MembershipPlan::factory()->create();

        $this->postJson('/api/v1/member/memberships', [
            'membership_plan_id' => $plan->id,
            'start_date' => '2026-11-20',
            'payment_method' => 'transfer',
        ])->assertForbidden();
    }

    public function test_member_cannot_mass_assign_status_or_amount(): void
    {
        $member = $this->actingAsMember();
        $plan = MembershipPlan::factory()->create(['price' => 500000]);

        $this->postJson('/api/v1/member/memberships', [
            'membership_plan_id' => $plan->id,
            'start_date' => '2026-11-20',
            'payment_method' => 'transfer',
            'status' => 'active',
            'amount' => 1,
            'user_id' => User::factory()->create()->id,
        ])->assertCreated();

        $this->assertDatabaseHas('memberships', ['user_id' => $member->id, 'status' => 'pending']);
        $this->assertDatabaseHas('transactions', ['user_id' => $member->id, 'amount' => 500000]);
        $this->assertSame(1, Membership::query()->count());
    }

    public function test_admin_cannot_overwrite_protected_plan_columns(): void
    {
        $this->actingAsAdmin();
        $plan = MembershipPlan::factory()->create();

        $this->putJson("/api/v1/admin/membership-plans/{$plan->id}", [
            'name' => 'Paket Uji',
            'duration_days' => 30,
            'price' => 500000,
            'id' => 999,
            'code' => 'monthly',
        ])->assertOk()->assertJsonPath('data.id', $plan->id);

        $this->assertDatabaseHas('membership_plans', ['id' => $plan->id, 'code' => null]);
    }

    public function test_free_text_is_stripped_of_html(): void
    {
        $this->actingAsAdmin();
        $transaction = Transaction::factory()->create();

        $this->postJson("/api/v1/admin/transactions/{$transaction->id}/reject", [
            'reason' => '<script>alert(1)</script>Bukti transfer <b>buram</b>',
        ])->assertOk();

        $this->assertDatabaseHas('transactions', ['id' => $transaction->id, 'reject_reason' => 'alert(1)Bukti transfer buram']);
    }

    public function test_plan_names_must_be_unique(): void
    {
        $this->actingAsAdmin();
        MembershipPlan::factory()->create(['name' => '1 Bulan']);

        $this->postJson('/api/v1/admin/membership-plans', ['name' => '1 Bulan', 'duration_days' => 30, 'price' => 500000])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_responses_never_include_password_hashes(): void
    {
        $member = User::factory()->create(['password' => 'rahasia-member']);

        $login = $this->postJson('/api/v1/login', ['email' => $member->email, 'password' => 'rahasia-member'])->assertOk();
        $this->assertStringNotContainsString('password', $login->getContent());

        Sanctum::actingAs(User::factory()->admin()->create());
        $this->assertStringNotContainsString('$2y$', $this->getJson('/api/v1/admin/members')->getContent());
    }
}
