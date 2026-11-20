<?php

namespace Tests\Feature;

use App\Enums\ScheduleStatus;
use App\Models\ClassParticipant;
use App\Models\ClassSchedule;
use App\Models\Membership;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingTest extends TestCase
{
    use RefreshDatabase;

    private function activeMember(): User
    {
        $member = User::factory()->create();
        Membership::factory()->for($member)->active(today()->subDays(5), 30)->create();

        return $this->actingAsMember($member);
    }

    private function bookingUrl(ClassSchedule $schedule): string
    {
        return "/api/v1/member/class-schedules/{$schedule->id}/booking";
    }

    public function test_active_member_can_book_and_counter_increases(): void
    {
        $this->activeMember();
        $schedule = ClassSchedule::factory()->create(['schedule_date' => '2026-11-21']);
        ClassParticipant::factory()->for($schedule, 'schedule')->create();

        $this->postJson($this->bookingUrl($schedule))
            ->assertOk()
            ->assertJsonPath('data.id', $schedule->id)
            ->assertJsonPath('data.is_booked', true)
            ->assertJsonPath('data.participants_count', 2)
            ->assertJsonPath('data.display_status', 'scheduled');
    }

    public function test_double_booking_is_a_conflict(): void
    {
        $this->activeMember();
        $schedule = ClassSchedule::factory()->create();

        $this->postJson($this->bookingUrl($schedule))->assertOk();
        $this->postJson($this->bookingUrl($schedule))
            ->assertConflict()
            ->assertJsonPath('message', 'Anda sudah membooking sesi ini.');

        $this->assertSame(1, ClassParticipant::query()->count());
    }

    public function test_member_without_active_membership_cannot_book(): void
    {
        $this->actingAsMember();
        $schedule = ClassSchedule::factory()->create();

        $this->postJson($this->bookingUrl($schedule))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['booking' => 'Membership Anda tidak aktif pada tanggal sesi ini.']);
    }

    public function test_membership_must_cover_the_session_date(): void
    {
        $member = User::factory()->create();
        Membership::factory()->for($member)->active(today()->subDays(29), 30)->create();
        $this->actingAsMember($member);
        $schedule = ClassSchedule::factory()->create(['schedule_date' => '2026-11-21']);

        $this->postJson($this->bookingUrl($schedule))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['booking']);
    }

    public function test_approved_future_membership_can_book_sessions_inside_its_period(): void
    {
        $member = User::factory()->create();
        Membership::factory()->for($member)->active(today()->addDays(3), 30)->create();
        $this->actingAsMember($member);

        $tooEarly = ClassSchedule::factory()->create(['schedule_date' => '2026-11-22']);
        $inside = ClassSchedule::factory()->create(['schedule_date' => '2026-11-23']);

        $this->postJson($this->bookingUrl($tooEarly))->assertUnprocessable();
        $this->postJson($this->bookingUrl($inside))->assertOk();
    }

    public function test_only_scheduled_sessions_that_have_not_started_can_be_booked(): void
    {
        $this->activeMember();

        $cancelled = ClassSchedule::factory()->cancelled()->create();
        $ongoing = ClassSchedule::factory()->create(['status' => ScheduleStatus::Ongoing]);
        $started = ClassSchedule::factory()->create(['schedule_date' => '2026-11-20', 'start_time' => '08:30:00', 'end_time' => '09:30:00']);

        $this->postJson($this->bookingUrl($cancelled))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['booking' => 'Sesi kelas ini sudah dibatalkan.']);
        $this->postJson($this->bookingUrl($ongoing))->assertUnprocessable();
        $this->postJson($this->bookingUrl($started))->assertUnprocessable();
    }

    public function test_booking_requires_token(): void
    {
        $schedule = ClassSchedule::factory()->create();

        $this->postJson($this->bookingUrl($schedule))->assertUnauthorized();
        $this->getJson('/api/v1/member/class-schedules')->assertUnauthorized();
    }

    public function test_unknown_schedule_returns_404(): void
    {
        $this->activeMember();

        $this->postJson('/api/v1/member/class-schedules/999/booking')->assertNotFound();
    }

    public function test_member_can_cancel_and_book_again(): void
    {
        $this->activeMember();
        $schedule = ClassSchedule::factory()->create();

        $this->postJson($this->bookingUrl($schedule))->assertOk();

        $this->deleteJson($this->bookingUrl($schedule))
            ->assertOk()
            ->assertJsonPath('data.is_booked', false)
            ->assertJsonPath('data.participants_count', 0);

        $this->postJson($this->bookingUrl($schedule))
            ->assertOk()
            ->assertJsonPath('data.participants_count', 1);

        $this->assertSame(1, ClassParticipant::query()->count());
    }

    public function test_cancel_without_booking_returns_404(): void
    {
        $this->activeMember();
        $schedule = ClassSchedule::factory()->create();

        $this->deleteJson($this->bookingUrl($schedule))->assertNotFound();
    }

    public function test_cannot_cancel_after_session_started(): void
    {
        $member = $this->activeMember();
        $schedule = ClassSchedule::factory()->create(['schedule_date' => '2026-11-20', 'start_time' => '08:00:00', 'end_time' => '10:00:00']);
        ClassParticipant::factory()->for($schedule, 'schedule')->for($member)->create();

        $this->deleteJson($this->bookingUrl($schedule))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['booking']);
    }

    public function test_schedule_list_shows_booking_flag_counter_and_display_status(): void
    {
        $member = $this->activeMember();
        $booked = ClassSchedule::factory()->create(['schedule_date' => '2026-11-21']);
        ClassParticipant::factory()->for($booked, 'schedule')->for($member)->create();
        ClassParticipant::factory()->for($booked, 'schedule')->cancelled()->create();
        ClassSchedule::factory()->create(['schedule_date' => '2026-11-20', 'start_time' => '08:30:00', 'end_time' => '09:30:00']);
        ClassSchedule::factory()->create(['schedule_date' => '2026-11-30']);

        $this->getJson('/api/v1/member/class-schedules')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.display_status', 'ongoing')
            ->assertJsonPath('data.0.is_booked', false)
            ->assertJsonPath('data.1.id', $booked->id)
            ->assertJsonPath('data.1.is_booked', true)
            ->assertJsonPath('data.1.participants_count', 1)
            ->assertJsonPath('data.1.min_participants', 3);

        $this->getJson('/api/v1/member/class-schedules?from=2026-11-01&to=2026-12-15')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['to']);
    }

    public function test_member_bookings_list_only_upcoming_active_bookings(): void
    {
        $member = $this->activeMember();
        $upcoming = ClassSchedule::factory()->create(['schedule_date' => '2026-11-22']);
        $past = ClassSchedule::factory()->create(['schedule_date' => '2026-11-19']);
        $cancelledBooking = ClassSchedule::factory()->create(['schedule_date' => '2026-11-23']);
        ClassParticipant::factory()->for($upcoming, 'schedule')->for($member)->create();
        ClassParticipant::factory()->for($past, 'schedule')->for($member)->create();
        ClassParticipant::factory()->for($cancelledBooking, 'schedule')->for($member)->cancelled()->create();

        $this->getJson('/api/v1/member/bookings')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $upcoming->id);
    }
}
