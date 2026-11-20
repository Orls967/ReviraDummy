<?php

namespace Database\Seeders;

use App\Models\MembershipPlan;
use Illuminate\Database\Seeder;

class MembershipPlanSeeder extends Seeder
{
    public const MONTHLY = 'Bulanan';

    public const QUARTERLY = 'Triwulan';

    public const YEARLY = 'Tahunan';

    public function run(): void
    {
        $plans = [
            [self::MONTHLY, 30, 150000, 'Akses gym dan semua kelas selama 30 hari.'],
            [self::QUARTERLY, 90, 400000, 'Akses gym dan semua kelas selama 90 hari, lebih hemat dari bulanan.'],
            [self::YEARLY, 365, 1400000, 'Akses gym dan semua kelas selama satu tahun penuh.'],
        ];

        foreach ($plans as [$name, $days, $price, $description]) {
            MembershipPlan::query()->updateOrCreate(
                ['name' => $name],
                ['duration_days' => $days, 'price' => $price, 'description' => $description, 'is_active' => true],
            );
        }
    }
}
