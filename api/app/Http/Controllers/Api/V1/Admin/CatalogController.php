<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\GymClassResource;
use App\Http\Resources\InstructorResource;
use App\Services\Schedules\ScheduleCatalog;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Data pilihan untuk form jadwal: kelas dan instruktur yang aktif.
 */
class CatalogController extends Controller
{
    public function __construct(private readonly ScheduleCatalog $catalog) {}

    public function classes(): AnonymousResourceCollection
    {
        return GymClassResource::collection($this->catalog->activeClasses());
    }

    public function instructors(): AnonymousResourceCollection
    {
        return InstructorResource::collection($this->catalog->activeInstructors());
    }
}
