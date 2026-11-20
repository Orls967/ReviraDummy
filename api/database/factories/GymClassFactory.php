<?php

namespace Database\Factories;

use App\Models\GymClass;
use App\Models\Instructor;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<GymClass>
 */
class GymClassFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => 'Kelas '.fake()->unique()->word(),
            'description' => fake()->sentence(),
            'min_participants' => 3,
            'default_instructor_id' => Instructor::factory(),
            'is_active' => true,
        ];
    }
}
