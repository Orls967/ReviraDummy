<?php

return [
    'after' => ':Attribute harus setelah :date.',
    'after_or_equal' => ':Attribute harus sama dengan atau setelah :date.',
    'boolean' => ':Attribute harus bernilai benar atau salah.',
    'date_format' => ':Attribute harus berformat :format.',
    'email' => ':Attribute harus berupa alamat email yang valid.',
    'enum' => 'Pilihan :attribute tidak valid.',
    'exists' => ':Attribute tidak ditemukan atau tidak aktif.',
    'in' => 'Pilihan :attribute tidak valid.',
    'integer' => ':Attribute harus berupa bilangan bulat.',
    'max' => [
        'numeric' => ':Attribute maksimal :max.',
        'string' => ':Attribute maksimal :max karakter.',
    ],
    'min' => [
        'numeric' => ':Attribute minimal :min.',
        'string' => ':Attribute minimal :min karakter.',
    ],
    'required' => ':Attribute wajib diisi.',
    'required_if' => ':Attribute wajib diisi bila :other adalah :value.',
    'string' => ':Attribute harus berupa teks.',

    'custom' => [
        'start_date' => [
            'after_or_equal' => 'Tanggal mulai tidak boleh sebelum hari ini.',
        ],
        'schedule_date' => [
            'after_or_equal' => 'Tanggal sesi tidak boleh sebelum hari ini.',
        ],
        'cancel_reason' => [
            'required_if' => 'Alasan pembatalan wajib diisi saat membatalkan sesi.',
        ],
    ],

    'attributes' => [
        'cancel_reason' => 'alasan pembatalan',
        'description' => 'deskripsi',
        'device_name' => 'nama perangkat',
        'duration_days' => 'durasi (hari)',
        'email' => 'email',
        'end_time' => 'jam selesai',
        'from' => 'tanggal awal',
        'gym_class_id' => 'kelas',
        'instructor_id' => 'instruktur',
        'is_active' => 'status aktif',
        'membership_plan_id' => 'paket membership',
        'name' => 'nama',
        'page' => 'halaman',
        'password' => 'kata sandi',
        'payment_method' => 'metode pembayaran',
        'price' => 'harga',
        'reason' => 'alasan',
        'schedule_date' => 'tanggal sesi',
        'search' => 'kata kunci',
        'start_date' => 'tanggal mulai',
        'start_time' => 'jam mulai',
        'status' => 'status',
        'to' => 'tanggal akhir',
    ],
];
