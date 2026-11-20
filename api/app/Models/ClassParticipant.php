<?php

namespace App\Models;

use App\Enums\ParticipantStatus;
use Database\Factories\ClassParticipantFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Booking member pada sebuah sesi. Pembatalan mengubah status, bukan menghapus baris,
 * sehingga UNIQUE (class_schedule_id, user_id) tetap terjaga saat member booking ulang.
 */
class ClassParticipant extends Model
{
    /** @use HasFactory<ClassParticipantFactory> */
    use HasFactory;

    protected $fillable = [
        'class_schedule_id',
        'user_id',
        'status',
        'booked_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => ParticipantStatus::class,
            'booked_at' => 'datetime',
        ];
    }

    /**
     * @param  Builder<ClassParticipant>  $query
     */
    public function scopeBooked(Builder $query): void
    {
        $query->where('status', ParticipantStatus::Booked->value);
    }

    /**
     * @return BelongsTo<ClassSchedule, $this>
     */
    public function schedule(): BelongsTo
    {
        return $this->belongsTo(ClassSchedule::class, 'class_schedule_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
