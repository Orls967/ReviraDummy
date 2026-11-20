<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexMemberRequest;
use App\Http\Resources\AdminMemberResource;
use App\Services\Members\MemberDirectory;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class MemberController extends Controller
{
    public function index(IndexMemberRequest $request, MemberDirectory $members): AnonymousResourceCollection
    {
        return AdminMemberResource::collection($members->paginate(
            today(),
            $request->status(),
            $request->planId(),
            $request->search(),
        ));
    }
}
