<?php

namespace App\Services\Schedules;

use App\Models\GymClass;
use App\Models\Instructor;
use Illuminate\Database\Eloquent\Collection;

class ScheduleCatalog
{
    /**
     * @return Collection<int, GymClass>
     */
    public function activeClasses(): Collection
    {
        return GymClass::query()->active()->orderBy('name')->get();
    }

    /**
     * @return Collection<int, Instructor>
     */
    public function activeInstructors(): Collection
    {
        return Instructor::query()->active()->orderBy('name')->get();
    }
}
