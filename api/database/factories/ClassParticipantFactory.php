<?php

namespace Database\Factories;

use App\Enums\ParticipantStatus;
use App\Models\ClassParticipant;
use App\Models\ClassSchedule;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ClassParticipant>
 */
class ClassParticipantFactory extends Factory
{
    public function definition(): array
    {
        return [
            'class_schedule_id' => ClassSchedule::factory(),
            'user_id' => User::factory(),
            'status' => ParticipantStatus::Booked,
            'booked_at' => now(),
        ];
    }

    public function cancelled(): static
    {
        return $this->state(fn () => ['status' => ParticipantStatus::Cancelled]);
    }
}
