<?php

namespace Tests\Feature;

use App\Enums\CurrentMembershipStatus;
use App\Models\ClassSchedule;
use App\Models\MembershipPlan;
use App\Models\User;
use App\Services\Memberships\MembershipStatusResolver;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\UserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use RuntimeException;
use Tests\TestCase;

class SeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeder_refuses_to_run_without_password(): void
    {
        config(['seeding.password' => null]);

        $this->expectException(RuntimeException::class);

        $this->seed(DatabaseSeeder::class);
    }

    public function test_seeder_creates_fictional_data_covering_every_status(): void
    {
        $password = Str::random(24);
        config(['seeding.password' => $password]);

        $this->seed(DatabaseSeeder::class);
        $this->seed(DatabaseSeeder::class);

        $this->assertSame(3, MembershipPlan::query()->count());
        $this->assertSame(1, User::query()->where('role', 'admin')->count());
        $this->assertSame(count(UserSeeder::MEMBERS), User::query()->members()->count());
        $this->assertSame(19, ClassSchedule::query()->count());

        $resolver = app(MembershipStatusResolver::class);
        $statuses = User::query()->members()->get()
            ->mapWithKeys(fn (User $user) => [$user->email => $resolver->forUser($user, today())->status])
            ->all();

        $this->assertSame(CurrentMembershipStatus::Active, $statuses['budi@revira.test']);
        $this->assertSame(CurrentMembershipStatus::Expired, $statuses['dewi@revira.test']);
        $this->assertSame(CurrentMembershipStatus::Pending, $statuses['rudi@revira.test']);
        $this->assertSame(CurrentMembershipStatus::None, $statuses['agus@revira.test']);
        $this->assertSame(CurrentMembershipStatus::None, $statuses['nina@revira.test']);

        $this->postJson('/api/v1/login', ['email' => UserSeeder::ADMIN_EMAIL, 'password' => $password])
            ->assertOk()
            ->assertJsonPath('data.user.role', 'admin');
    }
}
