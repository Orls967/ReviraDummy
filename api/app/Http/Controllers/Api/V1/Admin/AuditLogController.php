<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexAuditLogRequest;
use App\Http\Resources\AuditLogResource;
use App\Services\Audit\AuditLogger;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AuditLogController extends Controller
{
    public function __construct(private readonly AuditLogger $audit) {}

    public function index(IndexAuditLogRequest $request): AnonymousResourceCollection
    {
        return AuditLogResource::collection($this->audit->paginate($request->action()));
    }
}
