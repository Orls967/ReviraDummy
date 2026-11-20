<?php

namespace Tests;

use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Laravel\Sanctum\Sanctum;

abstract class TestCase extends BaseTestCase
{
    /** Waktu tetap (WITA) supaya aturan tanggal dan jam sesi bisa diuji secara deterministik. */
    protected const NOW = '2026-11-20 09:00:00';

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo(CarbonImmutable::parse(self::NOW));
    }

    protected function actingAsAdmin(): User
    {
        $admin = User::factory()->admin()->create();
        Sanctum::actingAs($admin);

        return $admin;
    }

    protected function actingAsMember(?User $member = null): User
    {
        $member ??= User::factory()->create();
        Sanctum::actingAs($member);

        return $member;
    }
}
