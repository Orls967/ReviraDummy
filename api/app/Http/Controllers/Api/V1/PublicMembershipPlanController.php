<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\MembershipPlanResource;
use App\Services\Plans\MembershipPlanService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PublicMembershipPlanController extends Controller
{
    public function __invoke(MembershipPlanService $plans): AnonymousResourceCollection
    {
        return MembershipPlanResource::collection($plans->activePlans());
    }
}
