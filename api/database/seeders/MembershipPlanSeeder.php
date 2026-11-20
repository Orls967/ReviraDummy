<?php

namespace Database\Seeders;

use App\Services\Plans\StandardPlanCatalog;
use Illuminate\Database\Seeder;

/**
 * Harga dan durasi paket diambil dari config membership.standard_plans.
 */
class MembershipPlanSeeder extends Seeder
{
    public function run(StandardPlanCatalog $catalog): void
    {
        $catalog->sync();
    }
}
