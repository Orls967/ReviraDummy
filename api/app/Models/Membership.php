<?php

namespace App\Models;

use App\Casts\DateOnly;
use App\Enums\MembershipRecordType;
use App\Enums\MembershipStatus;
use Carbon\CarbonInterface;
use Database\Factories\MembershipFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * Satu periode keanggotaan. Setiap pengajuan atau perpanjangan adalah baris baru.
 * end_date bersifat inklusif dan baru diisi saat admin menyetujui pengajuan.
 */
class Membership extends Model
{
    /** @use HasFactory<MembershipFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'membership_plan_id',
        'record_type',
        'start_date',
        'end_date',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'record_type' => MembershipRecordType::class,
            'status' => MembershipStatus::class,
            'start_date' => DateOnly::class,
            'end_date' => DateOnly::class,
        ];
    }

    public function isActiveOn(CarbonInterface $date): bool
    {
        return $this->status === MembershipStatus::Active
            && $this->start_date !== null
            && $this->end_date !== null
            && $this->start_date->toDateString() <= $date->toDateString()
            && $this->end_date->toDateString() >= $date->toDateString();
    }

    /**
     * Membership yang berlaku pada tanggal tertentu (start_date <= tanggal <= end_date).
     *
     * @param  Builder<Membership>  $query
     */
    public function scopeActiveOn(Builder $query, CarbonInterface $date): void
    {
        $query->where('status', MembershipStatus::Active->value)
            ->whereDate('start_date', '<=', $date->toDateString())
            ->whereDate('end_date', '>=', $date->toDateString());
    }

    /**
     * @param  Builder<Membership>  $query
     */
    public function scopePending(Builder $query): void
    {
        $query->where('status', MembershipStatus::Pending->value);
    }

    /**
     * Sudah disetujui tetapi periodenya baru mulai setelah tanggal tersebut.
     *
     * @param  Builder<Membership>  $query
     */
    public function scopeUpcomingAfter(Builder $query, CarbonInterface $date): void
    {
        $query->where('status', MembershipStatus::Active->value)
            ->whereDate('start_date', '>', $date->toDateString());
    }

    /**
     * Sudah berakhir: berstatus expired, atau masih active tetapi end_date sudah lewat.
     *
     * @param  Builder<Membership>  $query
     */
    public function scopeLapsedBefore(Builder $query, CarbonInterface $date): void
    {
        $query->where(fn (Builder $query) => $query
            ->where('status', MembershipStatus::Expired->value)
            ->orWhere(fn (Builder $query) => $query
                ->where('status', MembershipStatus::Active->value)
                ->whereDate('end_date', '<', $date->toDateString())));
    }

    /**
     * Membership active yang periodenya beririsan dengan rentang tanggal (inklusif).
     *
     * @param  Builder<Membership>  $query
     */
    public function scopeOverlappingActive(Builder $query, CarbonInterface $start, CarbonInterface $end): void
    {
        $query->where('status', MembershipStatus::Active->value)
            ->whereDate('start_date', '<=', $end->toDateString())
            ->whereDate('end_date', '>=', $start->toDateString());
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<MembershipPlan, $this>
     */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(MembershipPlan::class, 'membership_plan_id');
    }

    /**
     * @return HasOne<Transaction, $this>
     */
    public function transaction(): HasOne
    {
        return $this->hasOne(Transaction::class)->latestOfMany();
    }
}
