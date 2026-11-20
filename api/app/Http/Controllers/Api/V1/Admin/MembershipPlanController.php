<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SaveMembershipPlanRequest;
use App\Http\Resources\MembershipPlanResource;
use App\Models\MembershipPlan;
use App\Services\Plans\MembershipPlanService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class MembershipPlanController extends Controller
{
    public function __construct(private readonly MembershipPlanService $plans) {}

    public function index(): AnonymousResourceCollection
    {
        return MembershipPlanResource::collection($this->plans->allPlans());
    }

    public function store(SaveMembershipPlanRequest $request): JsonResponse
    {
        return (new MembershipPlanResource($this->plans->create($request->validated(), $request->user())))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(MembershipPlan $membershipPlan): MembershipPlanResource
    {
        return new MembershipPlanResource($membershipPlan);
    }

    public function update(SaveMembershipPlanRequest $request, MembershipPlan $membershipPlan): MembershipPlanResource
    {
        return new MembershipPlanResource($this->plans->update($membershipPlan, $request->validated(), $request->user()));
    }

    public function destroy(Request $request, MembershipPlan $membershipPlan): Response
    {
        $this->plans->delete($membershipPlan, $request->user());

        return response()->noContent();
    }
}
