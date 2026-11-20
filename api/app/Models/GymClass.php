<?php

namespace App\Models;

use Database\Factories\GymClassFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GymClass extends Model
{
    /** @use HasFactory<GymClassFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'min_participants',
        'default_instructor_id',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'min_participants' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /**
     * @param  Builder<GymClass>  $query
     */
    public function scopeActive(Builder $query): void
    {
        $query->where('is_active', true);
    }

    /**
     * @return BelongsTo<Instructor, $this>
     */
    public function defaultInstructor(): BelongsTo
    {
        return $this->belongsTo(Instructor::class, 'default_instructor_id');
    }
}
