<?php

/*
|--------------------------------------------------------------------------
| Katalog paket membership standar
|--------------------------------------------------------------------------
|
| Satu-satunya tempat harga paket standar ditulis. Seeder dan migrasi sinkronisasi
| harga membaca daftar ini, lalu menyimpannya ke tabel membership_plans. Setelah itu
| tabel tersebut menjadi sumber harga untuk API, panel admin, dan aplikasi member.
| Harga dalam Rupiah utuh (tanpa desimal). legacy_name dipakai untuk mengenali paket
| lama hasil seeder versi sebelumnya agar diperbarui, bukan diduplikasi.
|
*/

return [

    'standard_plans' => [
        'per_visit' => [
            'name' => 'Per Datang',
            'duration_days' => 1,
            'price' => 75000,
            'description' => 'Akses gym dan kelas untuk satu hari kunjungan.',
            'legacy_name' => null,
        ],
        'monthly' => [
            'name' => '1 Bulan',
            'duration_days' => 30,
            'price' => 500000,
            'description' => 'Akses gym dan semua kelas selama 30 hari.',
            'legacy_name' => 'Bulanan',
        ],
        'quarterly' => [
            'name' => '3 Bulan',
            'duration_days' => 90,
            'price' => 1050000,
            'description' => 'Akses gym dan semua kelas selama 90 hari.',
            'legacy_name' => 'Triwulan',
        ],
        'yearly' => [
            'name' => '1 Tahun',
            'duration_days' => 365,
            'price' => 3075000,
            'description' => 'Akses gym dan semua kelas selama satu tahun penuh.',
            'legacy_name' => 'Tahunan',
        ],
    ],

];
