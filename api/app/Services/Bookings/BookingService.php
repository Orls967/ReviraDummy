<?php

namespace App\Services\Bookings;

use App\Enums\ParticipantStatus;
use App\Enums\ScheduleStatus;
use App\Exceptions\ConflictException;
use App\Exceptions\ResourceNotFoundException;
use App\Models\ClassParticipant;
use App\Models\ClassSchedule;
use App\Models\User;
use App\Services\Memberships\MembershipStatusResolver;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Booking sesi kelas oleh member. Kelas tidak punya kapasitas maksimum, jadi tidak ada cek "penuh".
 * Baris jadwal dikunci selama transaksi agar request bersamaan untuk sesi yang sama diproses bergantian.
 */
class BookingService
{
    public function __construct(private readonly MembershipStatusResolver $membershipStatus) {}

    /**
     * Sesi yang dibooking member dan belum selesai, urut waktu.
     *
     * @return Collection<int, ClassSchedule>
     */
    public function upcomingFor(User $user): Collection
    {
        $now = now();

        return ClassSchedule::query()
            ->withDetails()
            ->withBookingFlag($user)
            ->whereHas('participants', fn ($query) => $query->booked()->where('user_id', $user->id))
            ->where(fn ($query) => $query
                ->whereDate('schedule_date', '>', $now->toDateString())
                ->orWhere(fn ($query) => $query
                    ->whereDate('schedule_date', $now->toDateString())
                    ->where('end_time', '>', $now->format('H:i:s'))))
            ->chronological()
            ->get();
    }

    /**
     * @throws ValidationException 422 bila sesi tidak bisa dibooking atau membership tidak aktif pada tanggal sesi
     * @throws ConflictException 409 bila member sudah membooking sesi ini
     */
    public function book(User $user, ClassSchedule $schedule): ClassParticipant
    {
        return DB::transaction(function () use ($user, $schedule) {
            $schedule = $this->lock($schedule);

            if ($schedule->status === ScheduleStatus::Cancelled) {
                $this->reject('Sesi kelas ini sudah dibatalkan.');
            }

            if ($schedule->status !== ScheduleStatus::Scheduled || $schedule->hasStarted(now())) {
                $this->reject('Sesi kelas ini sudah dimulai atau selesai.');
            }

            $participant = $schedule->participants()->where('user_id', $user->id)->first();

            if ($participant?->status === ParticipantStatus::Booked) {
                throw new ConflictException('Anda sudah membooking sesi ini.');
            }

            if (! $this->membershipStatus->isActiveOn($user, $schedule->schedule_date)) {
                $this->reject('Membership Anda tidak aktif pada tanggal sesi ini.');
            }

            $participant ??= $schedule->participants()->make(['user_id' => $user->id]);
            $participant->status = ParticipantStatus::Booked;
            $participant->booked_at = now();
            $participant->save();

            return $participant;
        });
    }

    /**
     * @throws ResourceNotFoundException 404 bila member tidak punya booking aktif di sesi ini
     * @throws ValidationException 422 bila sesi sudah dimulai
     */
    public function cancel(User $user, ClassSchedule $schedule): ClassParticipant
    {
        return DB::transaction(function () use ($user, $schedule) {
            $schedule = $this->lock($schedule);

            $participant = $schedule->participants()
                ->booked()
                ->where('user_id', $user->id)
                ->first();

            if ($participant === null) {
                throw new ResourceNotFoundException('Anda tidak punya booking di sesi ini.');
            }

            if ($schedule->hasStarted(now())) {
                $this->reject('Booking tidak bisa dibatalkan karena sesi sudah dimulai.');
            }

            $participant->update(['status' => ParticipantStatus::Cancelled]);

            return $participant;
        });
    }

    private function lock(ClassSchedule $schedule): ClassSchedule
    {
        return ClassSchedule::query()->whereKey($schedule->id)->lockForUpdate()->firstOrFail();
    }

    private function reject(string $message): never
    {
        throw ValidationException::withMessages(['booking' => $message]);
    }
}
