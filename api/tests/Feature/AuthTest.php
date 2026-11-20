<?php

namespace Tests\Feature;

use App\Models\Membership;
use App\Models\MembershipPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_returns_bearer_token_and_user(): void
    {
        $password = Str::random(20);
        $user = User::factory()->create(['password' => $password]);

        $this->postJson('/api/v1/login', ['email' => $user->email, 'password' => $password])
            ->assertOk()
            ->assertJsonPath('data.token_type', 'Bearer')
            ->assertJsonPath('data.user.id', $user->id)
            ->assertJsonPath('data.user.role', 'member')
            ->assertJsonStructure(['data' => ['token', 'user' => ['id', 'name', 'email', 'phone_number', 'role']]]);
    }

    public function test_login_rejects_wrong_password_with_422(): void
    {
        $user = User::factory()->create();

        $this->postJson('/api/v1/login', ['email' => $user->email, 'password' => 'bukan-kata-sandinya'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email' => 'Email atau kata sandi salah.']);
    }

    public function test_login_validates_input_with_422(): void
    {
        $this->postJson('/api/v1/login', ['email' => 'bukan-email'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_me_requires_token(): void
    {
        $this->getJson('/api/v1/me')->assertUnauthorized();
    }

    public function test_request_without_json_accept_header_still_gets_401_json(): void
    {
        $this->post('/api/v1/member/class-schedules/1/booking')
            ->assertUnauthorized()
            ->assertExactJson(['message' => 'Unauthenticated.']);
    }

    public function test_me_returns_current_membership_for_member(): void
    {
        $plan = MembershipPlan::factory()->create(['name' => 'Bulanan']);
        $member = $this->actingAsMember();
        Membership::factory()->for($member)->for($plan, 'plan')->active(today()->subDays(5))->create();

        $this->getJson('/api/v1/me')
            ->assertOk()
            ->assertJsonPath('data.id', $member->id)
            ->assertJsonPath('data.membership.status', 'active')
            ->assertJsonPath('data.membership.is_active', true)
            ->assertJsonPath('data.membership.plan.name', 'Bulanan')
            ->assertJsonPath('data.membership.start_date', '2026-11-15')
            ->assertJsonPath('data.membership.end_date', '2026-12-14');
    }

    public function test_me_flags_pending_extension_while_membership_is_active(): void
    {
        $member = $this->actingAsMember();
        Membership::factory()->for($member)->active(today()->subDays(5))->create();
        Membership::factory()->for($member)->create(['start_date' => '2026-12-15']);

        $this->getJson('/api/v1/me')
            ->assertOk()
            ->assertJsonPath('data.membership.status', 'active')
            ->assertJsonPath('data.membership.has_pending_application', true);
    }

    public function test_me_returns_none_for_member_without_membership(): void
    {
        $this->actingAsMember();

        $this->getJson('/api/v1/me')
            ->assertOk()
            ->assertJsonPath('data.membership.status', 'none')
            ->assertJsonPath('data.membership.is_active', false)
            ->assertJsonPath('data.membership.has_pending_application', false)
            ->assertJsonPath('data.membership.plan', null);
    }

    public function test_me_has_no_membership_block_for_admin(): void
    {
        $this->actingAsAdmin();

        $this->getJson('/api/v1/me')
            ->assertOk()
            ->assertJsonPath('data.role', 'admin')
            ->assertJsonPath('data.membership', null);
    }

    public function test_logout_revokes_current_token(): void
    {
        $token = User::factory()->create()->createToken('test')->plainTextToken;

        $this->withToken($token)->postJson('/api/v1/logout')->assertNoContent();
        $this->app['auth']->forgetGuards();

        $this->withToken($token)->getJson('/api/v1/me')->assertUnauthorized();
    }

    public function test_role_middleware_blocks_other_roles(): void
    {
        $this->actingAsMember();
        $this->getJson('/api/v1/admin/members')
            ->assertForbidden()
            ->assertJsonPath('message', 'Anda tidak memiliki akses ke sumber daya ini.');

        $this->actingAsAdmin();
        $this->getJson('/api/v1/member/bookings')->assertForbidden();
    }
}
