<?php

namespace App\Http\Controllers\Api\V1\Member;

use App\Http\Controllers\Controller;
use App\Http\Requests\Member\StoreMembershipRequest;
use App\Http\Resources\MembershipResource;
use App\Services\Memberships\MembershipApplicationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class MembershipController extends Controller
{
    public function __construct(private readonly MembershipApplicationService $applications) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        return MembershipResource::collection($this->applications->history($request->user()));
    }

    public function store(StoreMembershipRequest $request): JsonResponse
    {
        $membership = $this->applications->submit(
            $request->user(),
            $request->plan(),
            $request->startDate(),
            $request->paymentMethod(),
        );

        return (new MembershipResource($membership))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }
}
