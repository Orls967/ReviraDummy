<?php

namespace App\Services\Schedules;

use App\Enums\ScheduleStatus;
use App\Exceptions\ConflictException;
use App\Models\ClassSchedule;
use App\Models\User;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Validation\ValidationException;

class ClassScheduleService
{
    /**
     * @return Collection<int, ClassSchedule>
     */
    public function between(CarbonInterface $from, CarbonInterface $to, ?User $viewer = null): Collection
    {
        return ClassSchedule::query()
            ->withDetails()
            ->when($viewer, fn ($query) => $query->withBookingFlag($viewer))
            ->betweenDates($from, $to)
            ->chronological()
            ->get();
    }

    public function detailFor(ClassSchedule $schedule, User $viewer): ClassSchedule
    {
        return ClassSchedule::query()
            ->withDetails()
            ->withBookingFlag($viewer)
            ->findOrFail($schedule->id);
    }

    public function detailWithParticipants(ClassSchedule $schedule): ClassSchedule
    {
        return $schedule->loadDetails()->load([
            'bookedParticipants' => fn ($query) => $query->with('user')->orderBy('booked_at'),
        ]);
    }

    /**
     * @param  array{gym_class_id: int, instructor_id: int, schedule_date: string, start_time: string, end_time: string}  $data
     *
     * @throws ValidationException bila waktu mulai sudah lewat atau instruktur bentrok
     */
    public function create(array $data): ClassSchedule
    {
        $attributes = $this->normalize($data);
        $this->ensureValidSlot($attributes);

        return ClassSchedule::query()
            ->create($attributes + ['status' => ScheduleStatus::Scheduled])
            ->loadDetails();
    }

    /**
     * @param  array{gym_class_id: int, instructor_id: int, schedule_date: string, start_time: string, end_time: string}  $data
     *
     * @throws ValidationException bila sesi tidak bisa diubah, waktu mulai sudah lewat, atau instruktur bentrok
     */
    public function update(ClassSchedule $schedule, array $data): ClassSchedule
    {
        if ($schedule->status !== ScheduleStatus::Scheduled || $schedule->hasStarted(now())) {
            throw ValidationException::withMessages([
                'schedule' => 'Hanya sesi terjadwal yang belum dimulai yang bisa diubah.',
            ]);
        }

        $attributes = $this->normalize($data);
        $this->ensureValidSlot($attributes, $schedule);

        $schedule->update($attributes);

        return $schedule->loadDetails();
    }

    /**
     * @throws ValidationException bila perpindahan status tidak diizinkan
     */
    public function changeStatus(ClassSchedule $schedule, ScheduleStatus $target, ?string $cancelReason): ClassSchedule
    {
        if (! $schedule->status->canTransitionTo($target)) {
            throw ValidationException::withMessages([
                'status' => 'Status sesi tidak bisa diubah dari '.$schedule->status->value.' ke '.$target->value.'.',
            ]);
        }

        $schedule->update([
            'status' => $target,
            'cancel_reason' => $target === ScheduleStatus::Cancelled ? $cancelReason : null,
        ]);

        return $schedule->loadDetails();
    }

    /**
     * @throws ConflictException bila sesi sudah pernah dibooking
     */
    public function delete(ClassSchedule $schedule): void
    {
        if ($schedule->participants()->exists()) {
            throw new ConflictException('Sesi yang sudah pernah dibooking tidak bisa dihapus. Batalkan sesinya saja.');
        }

        $schedule->delete();
    }

    /**
     * @param  array{gym_class_id: int, instructor_id: int, schedule_date: string, start_time: string, end_time: string}  $data
     * @return array{gym_class_id: int, instructor_id: int, schedule_date: string, start_time: string, end_time: string}
     */
    private function normalize(array $data): array
    {
        return [
            'gym_class_id' => (int) $data['gym_class_id'],
            'instructor_id' => (int) $data['instructor_id'],
            'schedule_date' => $data['schedule_date'],
            'start_time' => $data['start_time'].':00',
            'end_time' => $data['end_time'].':00',
        ];
    }

    /**
     * @param  array{gym_class_id: int, instructor_id: int, schedule_date: string, start_time: string, end_time: string}  $attributes
     */
    private function ensureValidSlot(array $attributes, ?ClassSchedule $ignore = null): void
    {
        $startsAt = CarbonImmutable::parse($attributes['schedule_date'].' '.$attributes['start_time']);

        if ($startsAt->lessThanOrEqualTo(now())) {
            throw ValidationException::withMessages(['start_time' => 'Waktu mulai sesi sudah lewat.']);
        }

        $clashes = ClassSchedule::query()
            ->clashingWith(
                $attributes['instructor_id'],
                $attributes['schedule_date'],
                $attributes['start_time'],
                $attributes['end_time'],
            )
            ->when($ignore, fn ($query) => $query->whereKeyNot($ignore->id))
            ->exists();

        if ($clashes) {
            throw ValidationException::withMessages([
                'instructor_id' => 'Instruktur sudah mengajar sesi lain pada jam tersebut.',
            ]);
        }
    }
}
