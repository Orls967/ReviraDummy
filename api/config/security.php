<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Umur token akses (menit)
    |--------------------------------------------------------------------------
    |
    | Token admin dibuat lebih pendek karena membuka akses ke data semua member.
    | Token yang kedaluwarsa ditolak Sanctum dan dihapus saat user login berikutnya.
    |
    */

    'token_ttl_minutes' => [
        'admin' => (int) env('ADMIN_TOKEN_TTL_MINUTES', 480),
        'member' => (int) env('MEMBER_TOKEN_TTL_MINUTES', 43200),
    ],

    /*
    |--------------------------------------------------------------------------
    | Batas permintaan per menit
    |--------------------------------------------------------------------------
    */

    'rate_limits' => [
        'login_per_account' => 5,
        'login_per_ip' => 20,
        'api_per_user' => 120,
        'member_actions_per_user' => 20,
    ],

];
