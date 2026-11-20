<?php

namespace Tests\Feature;

use App\Models\Membership;
use App\Models\MembershipPlan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MembershipPlanTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_list_shows_only_active_plans_sorted_by_price(): void
    {
        MembershipPlan::factory()->create(['name' => '1 Tahun', 'price' => 3075000, 'duration_days' => 365]);
        MembershipPlan::factory()->create(['name' => '1 Bulan', 'price' => 500000]);
        MembershipPlan::factory()->inactive()->create(['name' => 'Lama']);

        $this->getJson('/api/v1/membership-plans')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.name', '1 Bulan')
            ->assertJsonPath('data.0.price', 500000)
            ->assertJsonPath('data.1.name', '1 Tahun')
            ->assertJsonPath('data.1.duration_days', 365);
    }

    public function test_admin_can_create_plan(): void
    {
        $this->actingAsAdmin();

        $this->postJson('/api/v1/admin/membership-plans', [
            'name' => '3 Bulan',
            'duration_days' => 90,
            'price' => 1050000,
            'description' => 'Tiga bulan.',
        ])
            ->assertCreated()
            ->assertJsonPath('data.name', '3 Bulan')
            ->assertJsonPath('data.is_active', true);

        $this->assertDatabaseHas('membership_plans', ['name' => '3 Bulan', 'duration_days' => 90, 'price' => 1050000]);
    }

    public function test_create_plan_validates_input(): void
    {
        $this->actingAsAdmin();

        $this->postJson('/api/v1/admin/membership-plans', ['name' => '', 'duration_days' => 0, 'price' => -1])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'duration_days', 'price']);
    }

    public function test_admin_can_show_update_and_deactivate_plan(): void
    {
        $this->actingAsAdmin();
        $plan = MembershipPlan::factory()->create();

        $this->getJson("/api/v1/admin/membership-plans/{$plan->id}")->assertOk()->assertJsonPath('data.id', $plan->id);

        $this->putJson("/api/v1/admin/membership-plans/{$plan->id}", [
            'name' => '1 Bulan Plus',
            'duration_days' => 31,
            'price' => 525000,
            'is_active' => false,
        ])
            ->assertOk()
            ->assertJsonPath('data.name', '1 Bulan Plus')
            ->assertJsonPath('data.is_active', false);

        $this->getJson('/api/v1/admin/membership-plans')->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_admin_can_delete_unused_plan(): void
    {
        $this->actingAsAdmin();
        $plan = MembershipPlan::factory()->create();

        $this->deleteJson("/api/v1/admin/membership-plans/{$plan->id}")->assertNoContent();

        $this->assertModelMissing($plan);
    }

    public function test_deleting_used_plan_is_a_conflict(): void
    {
        $this->actingAsAdmin();
        $plan = MembershipPlan::factory()->create();
        Membership::factory()->for($plan, 'plan')->create();

        $this->deleteJson("/api/v1/admin/membership-plans/{$plan->id}")->assertConflict();

        $this->assertModelExists($plan);
    }

    public function test_unknown_plan_returns_404(): void
    {
        $this->actingAsAdmin();

        $this->getJson('/api/v1/admin/membership-plans/999')
            ->assertNotFound()
            ->assertJsonPath('message', 'Data tidak ditemukan.');
    }

    public function test_plan_management_requires_admin(): void
    {
        $this->postJson('/api/v1/admin/membership-plans', [])->assertUnauthorized();

        $this->actingAsMember();
        $this->postJson('/api/v1/admin/membership-plans', [])->assertForbidden();
    }
}
