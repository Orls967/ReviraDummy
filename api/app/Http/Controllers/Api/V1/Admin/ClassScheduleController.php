<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SaveClassScheduleRequest;
use App\Http\Requests\Admin\UpdateClassScheduleStatusRequest;
use App\Http\Requests\Schedules\ScheduleRangeRequest;
use App\Http\Resources\ClassScheduleResource;
use App\Models\ClassSchedule;
use App\Services\Schedules\ClassScheduleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class ClassScheduleController extends Controller
{
    public function __construct(private readonly ClassScheduleService $schedules) {}

    public function index(ScheduleRangeRequest $request): AnonymousResourceCollection
    {
        return ClassScheduleResource::collection($this->schedules->between($request->from(), $request->to()));
    }

    public function store(SaveClassScheduleRequest $request): JsonResponse
    {
        return (new ClassScheduleResource($this->schedules->create($request->validated(), $request->user())))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(ClassSchedule $classSchedule): ClassScheduleResource
    {
        return new ClassScheduleResource($this->schedules->detailWithParticipants($classSchedule));
    }

    public function update(SaveClassScheduleRequest $request, ClassSchedule $classSchedule): ClassScheduleResource
    {
        return new ClassScheduleResource($this->schedules->update($classSchedule, $request->validated(), $request->user()));
    }

    public function updateStatus(UpdateClassScheduleStatusRequest $request, ClassSchedule $classSchedule): ClassScheduleResource
    {
        return new ClassScheduleResource($this->schedules->changeStatus(
            $classSchedule,
            $request->targetStatus(),
            $request->cancelReason(),
            $request->user(),
        ));
    }

    public function destroy(Request $request, ClassSchedule $classSchedule): Response
    {
        $this->schedules->delete($classSchedule, $request->user());

        return response()->noContent();
    }
}
