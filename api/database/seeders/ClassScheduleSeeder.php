<?php

namespace Database\Seeders;

use App\Enums\ParticipantStatus;
use App\Enums\ScheduleStatus;
use App\Models\ClassSchedule;
use App\Models\GymClass;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;

/**
 * Jadwal relatif terhadap hari ini: satu sesi kemarin yang sudah selesai, lalu sesi untuk tujuh hari ke depan.
 */
class ClassScheduleSeeder extends Seeder
{
    public function run(): void
    {
        $today = CarbonImmutable::today();
        $classes = GymClass::query()->get()->keyBy('name');

        $yesterdayYoga = $this->schedule($classes[ClassCatalogSeeder::YOGA], $today->subDay(), '07:00', '08:00', ScheduleStatus::Completed);
        $this->book($yesterdayYoga, ['budi@revira.test', 'sari@revira.test'], $today->subDays(2));

        foreach (range(0, 6) as $offset) {
            $date = $today->addDays($offset);

            $yoga = $this->schedule($classes[ClassCatalogSeeder::YOGA], $date, '07:00', '08:00');
            $hiit = $this->schedule($classes[ClassCatalogSeeder::HIIT], $date, '17:00', '18:00');

            if ($offset % 2 === 0) {
                $isCancelled = $offset === 2;
                $this->schedule(
                    $classes[ClassCatalogSeeder::ZUMBA],
                    $date,
                    '19:00',
                    '20:00',
                    $isCancelled ? ScheduleStatus::Cancelled : ScheduleStatus::Scheduled,
                    $isCancelled ? 'Instruktur berhalangan hadir.' : null,
                );
            }

            if ($offset === 1) {
                $this->book($yoga, ['budi@revira.test', 'sari@revira.test'], $today);
                $this->book($hiit, ['sari@revira.test'], $today);
            }

            if ($offset === 3) {
                $this->book($hiit, ['budi@revira.test'], $today);
            }
        }
    }

    private function schedule(
        GymClass $class,
        CarbonImmutable $date,
        string $start,
        string $end,
        ScheduleStatus $status = ScheduleStatus::Scheduled,
        ?string $cancelReason = null,
    ): ClassSchedule {
        return ClassSchedule::query()->updateOrCreate(
            ['gym_class_id' => $class->id, 'schedule_date' => $date->toDateString(), 'start_time' => $start.':00'],
            [
                'instructor_id' => $class->default_instructor_id,
                'end_time' => $end.':00',
                'status' => $status,
                'cancel_reason' => $cancelReason,
            ],
        );
    }

    /**
     * @param  list<string>  $emails
     */
    private function book(ClassSchedule $schedule, array $emails, CarbonImmutable $bookedAt): void
    {
        foreach (User::query()->whereIn('email', $emails)->get() as $member) {
            $schedule->participants()->firstOrCreate(
                ['user_id' => $member->id],
                ['status' => ParticipantStatus::Booked, 'booked_at' => $bookedAt->setTime(8, 0)],
            );
        }
    }
}
