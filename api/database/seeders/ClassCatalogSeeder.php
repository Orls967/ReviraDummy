<?php

namespace Database\Seeders;

use App\Models\GymClass;
use App\Models\Instructor;
use Illuminate\Database\Seeder;

class ClassCatalogSeeder extends Seeder
{
    public const YOGA = 'Yoga Pagi';

    public const HIIT = 'HIIT';

    public const ZUMBA = 'Zumba';

    public function run(): void
    {
        $classes = [
            [self::YOGA, 'Rina Wulandari', 'Yoga', 3, 'Peregangan dan pernapasan untuk memulai hari.'],
            [self::HIIT, 'Andi Pratama', 'HIIT', 4, 'Latihan interval intensitas tinggi selama 45 menit.'],
            [self::ZUMBA, 'Maya Sari', 'Zumba', 5, 'Kardio berirama dengan gerakan tari.'],
        ];

        foreach ($classes as [$className, $instructorName, $specialization, $minParticipants, $description]) {
            $instructor = Instructor::query()->updateOrCreate(
                ['name' => $instructorName],
                ['specialization' => $specialization, 'is_active' => true],
            );

            GymClass::query()->updateOrCreate(
                ['name' => $className],
                [
                    'description' => $description,
                    'min_participants' => $minParticipants,
                    'default_instructor_id' => $instructor->id,
                    'is_active' => true,
                ],
            );
        }
    }
}
