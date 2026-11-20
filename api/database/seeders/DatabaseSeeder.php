<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

/**
 * Data fiktif untuk pengembangan lokal. Kata sandi semua akun diambil dari config seeding.password (env SEED_PASSWORD).
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->isProduction()) {
            throw new RuntimeException('Seeder data fiktif tidak boleh dijalankan di production.');
        }

        $password = config('seeding.password');

        if (! is_string($password) || $password === '') {
            throw new RuntimeException('SEED_PASSWORD belum diisi. Tambahkan variabel ini ke environment sebelum menjalankan seeder.');
        }

        $this->call(MembershipPlanSeeder::class);
        $this->callWith(UserSeeder::class, ['passwordHash' => Hash::make($password)]);
        $this->call([
            MembershipSeeder::class,
            ClassCatalogSeeder::class,
            ClassScheduleSeeder::class,
        ]);
    }
}
