<?php

namespace Tests\Feature;

use App\Models\Membership;
use App\Models\MembershipPlan;
use App\Models\Transaction;
use App\Services\Plans\StandardPlanCatalog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PlanCatalogTest extends TestCase
{
    use RefreshDatabase;

    private const EXPECTED = [
        'Per Datang' => [1, 75000],
        '1 Bulan' => [30, 500000],
        '3 Bulan' => [90, 1050000],
        '1 Tahun' => [365, 3075000],
    ];

    public function test_sync_upgrades_legacy_plans_without_touching_history_or_custom_plans(): void
    {
        $monthly = MembershipPlan::factory()->create(['name' => 'Bulanan', 'duration_days' => 30, 'price' => 150000]);
        MembershipPlan::factory()->create(['name' => 'Triwulan', 'duration_days' => 90, 'price' => 400000]);
        MembershipPlan::factory()->create(['name' => 'Tahunan', 'duration_days' => 365, 'price' => 1400000]);
        $custom = MembershipPlan::factory()->create(['name' => 'Pelajar', 'price' => 250000]);
        $membership = Membership::factory()->for($monthly, 'plan')->create();
        $transaction = Transaction::factory()->for($membership)->create();

        $catalog = app(StandardPlanCatalog::class);
        $this->assertTrue($catalog->hasStandardPlans());

        $catalog->sync();
        $catalog->sync();

        $this->assertSame(5, MembershipPlan::query()->count());
        $this->assertSame('1 Bulan', $monthly->fresh()->name);
        $this->assertSame(500000, $monthly->fresh()->price);
        $this->assertSame(250000, $custom->fresh()->price);
        $this->assertSame(150000, $transaction->fresh()->amount);

        foreach (self::EXPECTED as $name => [$days, $price]) {
            $this->assertDatabaseHas('membership_plans', ['name' => $name, 'duration_days' => $days, 'price' => $price, 'is_active' => true]);
        }
    }

    public function test_empty_database_is_left_for_the_seeder(): void
    {
        MembershipPlan::factory()->create(['name' => 'Pelajar']);

        $this->assertFalse(app(StandardPlanCatalog::class)->hasStandardPlans());
    }

    public function test_public_endpoint_lists_catalog_prices_cheapest_first(): void
    {
        app(StandardPlanCatalog::class)->sync();

        $plans = $this->getJson('/api/v1/membership-plans')->assertOk()->json('data');

        $this->assertSame(
            array_keys(self::EXPECTED),
            array_column($plans, 'name'),
        );
        $this->assertSame(
            array_column(self::EXPECTED, 1),
            array_column($plans, 'price'),
        );
    }
}
