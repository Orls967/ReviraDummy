<?php

namespace App\Http\Controllers\Api\V1\Member;

use App\Http\Controllers\Controller;
use App\Http\Resources\ClassScheduleResource;
use App\Models\ClassSchedule;
use App\Services\Bookings\BookingService;
use App\Services\Schedules\ClassScheduleService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Booking dan pembatalan mengembalikan jadwal terbaru supaya aplikasi langsung
 * menampilkan counter peserta dan status booking tanpa request tambahan.
 */
class BookingController extends Controller
{
    public function __construct(
        private readonly BookingService $bookings,
        private readonly ClassScheduleService $schedules,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        return ClassScheduleResource::collection($this->bookings->upcomingFor($request->user()));
    }

    public function store(Request $request, ClassSchedule $classSchedule): ClassScheduleResource
    {
        $this->bookings->book($request->user(), $classSchedule);

        return new ClassScheduleResource($this->schedules->detailFor($classSchedule, $request->user()));
    }

    public function destroy(Request $request, ClassSchedule $classSchedule): ClassScheduleResource
    {
        $this->bookings->cancel($request->user(), $classSchedule);

        return new ClassScheduleResource($this->schedules->detailFor($classSchedule, $request->user()));
    }
}
