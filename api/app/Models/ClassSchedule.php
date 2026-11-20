<?php

namespace App\Models;

use App\Casts\DateOnly;
use App\Enums\ParticipantStatus;
use App\Enums\ScheduleStatus;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Database\Factories\ClassScheduleFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Satu sesi kelas pada tanggal dan jam tertentu (zona waktu aplikasi).
 * Jam disimpan sebagai teks HH:MM:SS sehingga bisa dibandingkan langsung di query.
 */
class ClassSchedule extends Model
{
    /** @use HasFactory<ClassScheduleFactory> */
    use HasFactory;

    protected $fillable = [
        'gym_class_id',
        'instructor_id',
        'schedule_date',
        'start_time',
        'end_time',
        'status',
        'cancel_reason',
    ];

    protected function casts(): array
    {
        return [
            'schedule_date' => DateOnly::class,
            'status' => ScheduleStatus::class,
        ];
    }

    public function startsAt(): CarbonImmutable
    {
        return CarbonImmutable::parse($this->schedule_date->toDateString().' '.$this->start_time);
    }

    public function endsAt(): CarbonImmutable
    {
        return CarbonImmutable::parse($this->schedule_date->toDateString().' '.$this->end_time);
    }

    public function hasStarted(CarbonInterface $now): bool
    {
        return $this->startsAt()->lessThanOrEqualTo($now);
    }

    /**
     * Status yang dilihat pengguna: status tersimpan dikoreksi oleh jam sekarang,
     * karena admin tidak selalu mengubah status tepat saat sesi mulai atau selesai.
     */
    public function displayStatus(CarbonInterface $now): ScheduleStatus
    {
        if (in_array($this->status, [ScheduleStatus::Cancelled, ScheduleStatus::Completed], true)) {
            return $this->status;
        }

        if ($this->endsAt()->lessThanOrEqualTo($now)) {
            return ScheduleStatus::Completed;
        }

        if ($this->status === ScheduleStatus::Ongoing || $this->hasStarted($now)) {
            return ScheduleStatus::Ongoing;
        }

        return ScheduleStatus::Scheduled;
    }

    /**
     * @param  Builder<ClassSchedule>  $query
     */
    public function scopeWithDetails(Builder $query): void
    {
        $query->with(['gymClass', 'instructor'])
            ->withCount(['participants as participants_count' => fn (Builder $query) => $query->booked()]);
    }

    /**
     * @param  Builder<ClassSchedule>  $query
     */
    public function scopeWithBookingFlag(Builder $query, User $user): void
    {
        $query->withExists(['participants as is_booked' => fn (Builder $query) => $query
            ->booked()
            ->where('user_id', $user->id)]);
    }

    /**
     * @param  Builder<ClassSchedule>  $query
     */
    public function scopeBetweenDates(Builder $query, CarbonInterface $from, CarbonInterface $to): void
    {
        $query->whereDate('schedule_date', '>=', $from->toDateString())
            ->whereDate('schedule_date', '<=', $to->toDateString());
    }

    /**
     * @param  Builder<ClassSchedule>  $query
     */
    public function scopeChronological(Builder $query): void
    {
        $query->orderBy('schedule_date')->orderBy('start_time')->orderBy('id');
    }

    /**
     * Sesi lain milik instruktur yang jamnya bertumpuk pada tanggal yang sama. Sesi batal tidak dihitung,
     * dan jam yang hanya bersentuhan (selesai 08:00, mulai 08:00) tidak dianggap bertumpuk.
     *
     * @param  Builder<ClassSchedule>  $query
     */
    public function scopeClashingWith(Builder $query, int $instructorId, string $date, string $startTime, string $endTime): void
    {
        $query->where('instructor_id', $instructorId)
            ->whereDate('schedule_date', $date)
            ->where('status', '!=', ScheduleStatus::Cancelled->value)
            ->where('start_time', '<', $endTime)
            ->where('end_time', '>', $startTime);
    }

    public function loadDetails(): static
    {
        return $this->load(['gymClass', 'instructor'])
            ->loadCount(['participants as participants_count' => fn (Builder $query) => $query->booked()]);
    }

    /**
     * @return BelongsTo<GymClass, $this>
     */
    public function gymClass(): BelongsTo
    {
        return $this->belongsTo(GymClass::class);
    }

    /**
     * @return BelongsTo<Instructor, $this>
     */
    public function instructor(): BelongsTo
    {
        return $this->belongsTo(Instructor::class);
    }

    /**
     * @return HasMany<ClassParticipant, $this>
     */
    public function participants(): HasMany
    {
        return $this->hasMany(ClassParticipant::class);
    }

    /**
     * @return HasMany<ClassParticipant, $this>
     */
    public function bookedParticipants(): HasMany
    {
        return $this->participants()->where('status', ParticipantStatus::Booked->value);
    }
}
