<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public const ADMIN_EMAIL = 'admin@revira.test';

    /**
     * Member fiktif: email => [nama, nomor telepon].
     */
    public const MEMBERS = [
        'budi@revira.test' => ['Budi Santoso', '081234500001'],
        'sari@revira.test' => ['Sari Lestari', '081234500002'],
        'dewi@revira.test' => ['Dewi Anggraini', '081234500003'],
        'rudi@revira.test' => ['Rudi Hartono', '081234500004'],
        'putri@revira.test' => ['Putri Maharani', '081234500005'],
        'agus@revira.test' => ['Agus Setiawan', '081234500006'],
        'nina@revira.test' => ['Nina Kartika', '081234500007'],
    ];

    public function run(string $passwordHash): void
    {
        User::query()->updateOrCreate(
            ['email' => self::ADMIN_EMAIL],
            ['name' => 'Admin Revira', 'phone_number' => '081200000001', 'role' => UserRole::Admin, 'password' => $passwordHash],
        );

        foreach (self::MEMBERS as $email => [$name, $phone]) {
            User::query()->updateOrCreate(
                ['email' => $email],
                ['name' => $name, 'phone_number' => $phone, 'role' => UserRole::Member, 'password' => $passwordHash],
            );
        }
    }
}
