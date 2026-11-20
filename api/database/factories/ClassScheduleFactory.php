<?php

namespace Database\Factories;

use App\Enums\ScheduleStatus;
use App\Models\ClassSchedule;
use App\Models\GymClass;
use App\Models\Instructor;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ClassSchedule>
 */
class ClassScheduleFactory extends Factory
{
    public function definition(): array
    {
        return [
            'gym_class_id' => GymClass::factory(),
            'instructor_id' => Instructor::factory(),
            'schedule_date' => today()->addDay()->toDateString(),
            'start_time' => '07:00:00',
            'end_time' => '08:00:00',
            'status' => ScheduleStatus::Scheduled,
            'cancel_reason' => null,
        ];
    }

    public function cancelled(string $reason = 'Instruktur berhalangan.'): static
    {
        return $this->state(fn () => [
            'status' => ScheduleStatus::Cancelled,
            'cancel_reason' => $reason,
        ]);
    }
}
