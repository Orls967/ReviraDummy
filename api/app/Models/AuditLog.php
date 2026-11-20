<?php

namespace App\Models;

use App\Enums\AuditAction;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

/**
 * Catatan audit bersifat append-only: model menolak update dan delete.
 */
class AuditLog extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = [
        'actor_id',
        'action',
        'subject_type',
        'subject_id',
        'properties',
        'ip_address',
    ];

    protected function casts(): array
    {
        return [
            'action' => AuditAction::class,
            'properties' => 'array',
            'created_at' => 'immutable_datetime',
        ];
    }

    protected static function booted(): void
    {
        static::updating(fn () => throw new LogicException('Catatan audit tidak boleh diubah.'));
        static::deleting(fn () => throw new LogicException('Catatan audit tidak boleh dihapus.'));
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
