<?php

namespace Tests\Feature;

use App\Enums\ScheduleStatus;
use App\Models\ClassParticipant;
use App\Models\ClassSchedule;
use App\Models\GymClass;
use App\Models\Instructor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminClassScheduleTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        $instructor = Instructor::factory()->create();

        return [
            'gym_class_id' => GymClass::factory()->create(['default_instructor_id' => $instructor->id])->id,
            'instructor_id' => $instructor->id,
            'schedule_date' => '2026-11-21',
            'start_time' => '07:00',
            'end_time' => '08:00',
            ...$overrides,
        ];
    }

    public function test_admin_can_create_schedule(): void
    {
        $this->actingAsAdmin();

        $this->postJson('/api/v1/admin/class-schedules', $this->payload())
            ->assertCreated()
            ->assertJsonPath('data.schedule_date', '2026-11-21')
            ->assertJsonPath('data.start_time', '07:00')
            ->assertJsonPath('data.end_time', '08:00')
            ->assertJsonPath('data.status', 'scheduled')
            ->assertJsonPath('data.participants_count', 0);

        $this->assertDatabaseHas('class_schedules', ['schedule_date' => '2026-11-21', 'start_time' => '07:00:00']);
    }

    public function test_create_validates_times_and_dates(): void
    {
        $this->actingAsAdmin();

        $this->postJson('/api/v1/admin/class-schedules', $this->payload([
            'schedule_date' => '2026-11-19',
            'start_time' => '09:00',
            'end_time' => '08:00',
        ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['schedule_date', 'end_time']);

        $this->postJson('/api/v1/admin/class-schedules', $this->payload([
            'schedule_date' => '2026-11-20',
            'start_time' => '08:00',
            'end_time' => '09:30',
        ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['start_time' => 'Waktu mulai sesi sudah lewat.']);
    }

    public function test_instructor_cannot_teach_two_overlapping_sessions(): void
    {
        $this->actingAsAdmin();
        $payload = $this->payload();

        $this->postJson('/api/v1/admin/class-schedules', $payload)->assertCreated();
        $this->postJson('/api/v1/admin/class-schedules', [...$payload, 'start_time' => '07:30', 'end_time' => '08:30'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['instructor_id']);
        $this->postJson('/api/v1/admin/class-schedules', [...$payload, 'start_time' => '08:00', 'end_time' => '09:00'])
            ->assertCreated();
    }

    public function test_admin_can_update_scheduled_session(): void
    {
        $this->actingAsAdmin();
        $schedule = ClassSchedule::factory()->create();

        $this->putJson("/api/v1/admin/class-schedules/{$schedule->id}", [
            'gym_class_id' => $schedule->gym_class_id,
            'instructor_id' => $schedule->instructor_id,
            'schedule_date' => '2026-11-22',
            'start_time' => '18:00',
            'end_time' => '19:00',
        ])
            ->assertOk()
            ->assertJsonPath('data.schedule_date', '2026-11-22')
            ->assertJsonPath('data.start_time', '18:00');
    }

    public function test_started_session_cannot_be_updated(): void
    {
        $this->actingAsAdmin();
        $schedule = ClassSchedule::factory()->create(['schedule_date' => '2026-11-20', 'start_time' => '08:00:00', 'end_time' => '10:00:00']);

        $this->putJson("/api/v1/admin/class-schedules/{$schedule->id}", [
            'gym_class_id' => $schedule->gym_class_id,
            'instructor_id' => $schedule->instructor_id,
            'schedule_date' => '2026-11-22',
            'start_time' => '18:00',
            'end_time' => '19:00',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['schedule']);
    }

    public function test_cancelling_requires_reason(): void
    {
        $this->actingAsAdmin();
        $schedule = ClassSchedule::factory()->create();

        $this->patchJson("/api/v1/admin/class-schedules/{$schedule->id}/status", ['status' => 'cancelled'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['cancel_reason']);

        $this->patchJson("/api/v1/admin/class-schedules/{$schedule->id}/status", [
            'status' => 'cancelled',
            'cancel_reason' => 'Instruktur sakit.',
        ])
            ->assertOk()
            ->assertJsonPath('data.status', 'cancelled')
            ->assertJsonPath('data.display_status', 'cancelled')
            ->assertJsonPath('data.cancel_reason', 'Instruktur sakit.');
    }

    public function test_invalid_status_transition_is_rejected(): void
    {
        $this->actingAsAdmin();
        $schedule = ClassSchedule::factory()->create(['status' => ScheduleStatus::Completed]);

        $this->patchJson("/api/v1/admin/class-schedules/{$schedule->id}/status", ['status' => 'ongoing'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['status']);

        $this->patchJson("/api/v1/admin/class-schedules/{$schedule->id}/status", ['status' => 'scheduled'])
            ->assertUnprocessable();
    }

    public function test_show_lists_booked_participants(): void
    {
        $this->actingAsAdmin();
        $schedule = ClassSchedule::factory()->create();
        $booking = ClassParticipant::factory()->for($schedule, 'schedule')->create();
        ClassParticipant::factory()->for($schedule, 'schedule')->cancelled()->create();

        $this->getJson("/api/v1/admin/class-schedules/{$schedule->id}")
            ->assertOk()
            ->assertJsonPath('data.participants_count', 1)
            ->assertJsonCount(1, 'data.participants')
            ->assertJsonPath('data.participants.0.member.id', $booking->user_id);
    }

    public function test_session_with_bookings_cannot_be_deleted(): void
    {
        $this->actingAsAdmin();
        $withBooking = ClassSchedule::factory()->create();
        ClassParticipant::factory()->for($withBooking, 'schedule')->cancelled()->create();
        $empty = ClassSchedule::factory()->create();

        $this->deleteJson("/api/v1/admin/class-schedules/{$withBooking->id}")->assertConflict();
        $this->deleteJson("/api/v1/admin/class-schedules/{$empty->id}")->assertNoContent();

        $this->assertModelExists($withBooking);
        $this->assertModelMissing($empty);
    }

    public function test_index_uses_date_range(): void
    {
        $this->actingAsAdmin();
        ClassSchedule::factory()->create(['schedule_date' => '2026-11-20', 'start_time' => '18:00:00', 'end_time' => '19:00:00']);
        ClassSchedule::factory()->create(['schedule_date' => '2026-11-26']);
        ClassSchedule::factory()->create(['schedule_date' => '2026-11-27']);

        $this->getJson('/api/v1/admin/class-schedules')->assertOk()->assertJsonCount(2, 'data');
        $this->getJson('/api/v1/admin/class-schedules?from=2026-11-27&to=2026-11-27')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/admin/class-schedules?from=2026-11-27&to=2026-11-20')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['to']);
    }

    public function test_catalog_lists_active_classes_and_instructors(): void
    {
        $this->actingAsAdmin();
        GymClass::factory()->create(['name' => 'Yoga']);
        GymClass::factory()->create(['name' => 'Lama', 'is_active' => false]);

        $this->getJson('/api/v1/admin/classes')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Yoga');

        $this->getJson('/api/v1/admin/instructors')->assertOk()->assertJsonCount(2, 'data');
    }
}
