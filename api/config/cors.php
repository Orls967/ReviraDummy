<?php

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
|
| Hanya origin yang terdaftar di CORS_ALLOWED_ORIGINS (dipisah koma) yang boleh memanggil API
| dari browser. Bawaannya alamat dev server admin web (Vite) dan member app (Expo web).
| API memakai bearer token, bukan cookie, sehingga credentials tidak diaktifkan.
|
*/

return [

    'paths' => ['api/*'],

    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    'allowed_origins' => array_values(array_filter(array_map('trim', explode(',', (string) env(
        'CORS_ALLOWED_ORIGINS',
        'http://localhost:5173,http://127.0.0.1:5173,http://localhost:8081,http://127.0.0.1:8081',
    ))))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['Accept', 'Authorization', 'Content-Type', 'X-Requested-With'],

    'exposed_headers' => ['Retry-After'],

    'max_age' => 600,

    'supports_credentials' => false,

];
