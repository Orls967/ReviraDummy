<?php

namespace Tests\Feature;

use App\Models\Membership;
use App\Models\MembershipPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminMemberListTest extends TestCase
{
    use RefreshDatabase;

    private MembershipPlan $monthly;

    private MembershipPlan $quarterly;

    protected function setUp(): void
    {
        parent::setUp();

        $this->monthly = MembershipPlan::factory()->create(['name' => '1 Bulan', 'duration_days' => 30]);
        $this->quarterly = MembershipPlan::factory()->create(['name' => '3 Bulan', 'duration_days' => 90]);
    }

    private function member(string $name): User
    {
        return User::factory()->create(['name' => $name]);
    }

    /**
     * @return array<string, User>
     */
    private function seedMembers(): array
    {
        $active = $this->member('A Aktif');
        Membership::factory()->for($active)->for($this->quarterly, 'plan')->active(today()->subDays(10), 90)->create();
        Membership::factory()->for($active)->for($this->monthly, 'plan')->create(['start_date' => '2027-03-01']);

        $pending = $this->member('B Pending');
        Membership::factory()->for($pending)->for($this->monthly, 'plan')->create();

        $upcoming = $this->member('C Akan Aktif');
        Membership::factory()->for($upcoming)->for($this->monthly, 'plan')->active(today()->addDays(5), 30)->create();

        $expired = $this->member('D Kedaluwarsa');
        Membership::factory()->for($expired)->for($this->quarterly, 'plan')->expired(today()->subDays(60), 90)->create();
        Membership::factory()->for($expired)->for($this->monthly, 'plan')->active(today()->subDays(40), 30)->create();

        $none = $this->member('E Tanpa');
        Membership::factory()->for($none)->for($this->monthly, 'plan')->rejected()->create();

        User::factory()->admin()->create(['name' => 'Admin Lain']);

        return compact('active', 'pending', 'upcoming', 'expired', 'none');
    }

    public function test_list_shows_current_status_plan_period_and_phone(): void
    {
        $this->actingAsAdmin();
        $members = $this->seedMembers();

        $response = $this->getJson('/api/v1/admin/members')
            ->assertOk()
            ->assertJsonCount(5, 'data')
            ->assertJsonPath('meta.total', 5)
            ->assertJsonPath('meta.current_page', 1);

        $rows = collect($response->json('data'))->keyBy('id');

        $this->assertSame('active', $rows[$members['active']->id]['membership_status']);
        $this->assertSame('3 Bulan', $rows[$members['active']->id]['plan']['name']);
        $this->assertSame('2026-11-10', $rows[$members['active']->id]['start_date']);
        $this->assertSame('2027-02-07', $rows[$members['active']->id]['end_date']);
        $this->assertSame($members['active']->phone_number, $rows[$members['active']->id]['phone_number']);

        $this->assertSame('pending', $rows[$members['pending']->id]['membership_status']);
        $this->assertSame('upcoming', $rows[$members['upcoming']->id]['membership_status']);
        $this->assertSame('expired', $rows[$members['expired']->id]['membership_status']);
        $this->assertSame('1 Bulan', $rows[$members['expired']->id]['plan']['name']);
        $this->assertSame('none', $rows[$members['none']->id]['membership_status']);
        $this->assertNull($rows[$members['none']->id]['plan']);
    }

    public function test_filter_by_status(): void
    {
        $this->actingAsAdmin();
        $members = $this->seedMembers();

        foreach (['active', 'pending', 'upcoming', 'expired', 'none'] as $status) {
            $this->getJson("/api/v1/admin/members?status={$status}")
                ->assertOk()
                ->assertJsonCount(1, 'data')
                ->assertJsonPath('data.0.id', $members[$status]->id);
        }
    }

    public function test_filter_by_plan_uses_plan_of_current_membership(): void
    {
        $this->actingAsAdmin();
        $members = $this->seedMembers();

        $quarterlyIds = collect($this->getJson("/api/v1/admin/members?membership_plan_id={$this->quarterly->id}")
            ->assertOk()
            ->json('data'))->pluck('id')->all();

        $this->assertSame([$members['active']->id], $quarterlyIds);

        $monthlyIds = collect($this->getJson("/api/v1/admin/members?membership_plan_id={$this->monthly->id}")
            ->assertOk()
            ->json('data'))->pluck('id')->sort()->values()->all();

        $this->assertSame(
            collect([$members['pending']->id, $members['upcoming']->id, $members['expired']->id])->sort()->values()->all(),
            $monthlyIds,
        );

        $this->getJson("/api/v1/admin/members?membership_plan_id={$this->monthly->id}&status=expired")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $members['expired']->id);

        $this->getJson("/api/v1/admin/members?membership_plan_id={$this->monthly->id}&status=none")
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_search_and_pagination(): void
    {
        $this->actingAsAdmin();
        User::factory()->count(16)->create();
        User::factory()->create(['name' => 'Zulaikha Unik', 'phone_number' => '089900011122']);

        $this->getJson('/api/v1/admin/members')
            ->assertOk()
            ->assertJsonCount(15, 'data')
            ->assertJsonPath('meta.total', 17)
            ->assertJsonPath('meta.last_page', 2);

        $this->getJson('/api/v1/admin/members?page=2')->assertOk()->assertJsonCount(2, 'data');

        $this->getJson('/api/v1/admin/members?search=0899000')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Zulaikha Unik');
    }

    public function test_invalid_filters_return_422(): void
    {
        $this->actingAsAdmin();

        $this->getJson('/api/v1/admin/members?status=aktif&membership_plan_id=999')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['status', 'membership_plan_id']);
    }
}
