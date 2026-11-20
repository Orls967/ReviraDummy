<?php

namespace App\Http\Controllers\Api\V1\Member;

use App\Http\Controllers\Controller;
use App\Http\Requests\Schedules\ScheduleRangeRequest;
use App\Http\Resources\ClassScheduleResource;
use App\Models\ClassSchedule;
use App\Services\Schedules\ClassScheduleService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ClassScheduleController extends Controller
{
    public function __construct(private readonly ClassScheduleService $schedules) {}

    public function index(ScheduleRangeRequest $request): AnonymousResourceCollection
    {
        return ClassScheduleResource::collection(
            $this->schedules->between($request->from(), $request->to(), $request->user()),
        );
    }

    public function show(Request $request, ClassSchedule $classSchedule): ClassScheduleResource
    {
        return new ClassScheduleResource($this->schedules->detailFor($classSchedule, $request->user()));
    }
}
