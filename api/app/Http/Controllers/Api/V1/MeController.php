<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\MeResource;
use App\Services\Memberships\MembershipStatusResolver;
use Illuminate\Http\Request;

class MeController extends Controller
{
    public function __invoke(Request $request, MembershipStatusResolver $resolver): MeResource
    {
        $user = $request->user();
        $summary = $user->isMember() ? $resolver->forUser($user, today()) : null;

        return new MeResource($user, $summary);
    }
}
