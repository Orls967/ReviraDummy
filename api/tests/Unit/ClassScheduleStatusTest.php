<?php

namespace Tests\Unit;

use App\Enums\ScheduleStatus;
use App\Models\ClassSchedule;
use Carbon\CarbonImmutable;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class ClassScheduleStatusTest extends TestCase
{
    /**
     * @return iterable<string, array{ScheduleStatus, string, ScheduleStatus}>
     */
    public static function cases(): iterable
    {
        yield 'sebelum mulai' => [ScheduleStatus::Scheduled, '2026-11-20 06:59:00', ScheduleStatus::Scheduled];
        yield 'tepat jam mulai' => [ScheduleStatus::Scheduled, '2026-11-20 07:00:00', ScheduleStatus::Ongoing];
        yield 'tepat jam selesai' => [ScheduleStatus::Scheduled, '2026-11-20 08:00:00', ScheduleStatus::Completed];
        yield 'dimulai admin lebih awal' => [ScheduleStatus::Ongoing, '2026-11-20 06:50:00', ScheduleStatus::Ongoing];
        yield 'batal tetap batal' => [ScheduleStatus::Cancelled, '2026-11-20 09:00:00', ScheduleStatus::Cancelled];
        yield 'selesai lebih awal' => [ScheduleStatus::Completed, '2026-11-20 07:30:00', ScheduleStatus::Completed];
    }

    #[DataProvider('cases')]
    public function test_display_status_follows_clock(ScheduleStatus $stored, string $now, ScheduleStatus $expected): void
    {
        $schedule = new ClassSchedule;
        $schedule->forceFill([
            'schedule_date' => '2026-11-20',
            'start_time' => '07:00:00',
            'end_time' => '08:00:00',
            'status' => $stored,
        ]);

        $this->assertSame($expected, $schedule->displayStatus(CarbonImmutable::parse($now)));
    }

    public function test_allowed_transitions(): void
    {
        $this->assertTrue(ScheduleStatus::Scheduled->canTransitionTo(ScheduleStatus::Cancelled));
        $this->assertTrue(ScheduleStatus::Ongoing->canTransitionTo(ScheduleStatus::Completed));
        $this->assertFalse(ScheduleStatus::Ongoing->canTransitionTo(ScheduleStatus::Scheduled));
        $this->assertFalse(ScheduleStatus::Cancelled->canTransitionTo(ScheduleStatus::Ongoing));
        $this->assertFalse(ScheduleStatus::Completed->canTransitionTo(ScheduleStatus::Cancelled));
    }
}
