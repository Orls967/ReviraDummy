<?php

namespace App\Http\Resources;

use App\Services\Memberships\MembershipSummary;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property MembershipSummary $resource
 */
class MembershipSummaryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $membership = $this->resource->membership;

        return [
            'status' => $this->resource->status->value,
            'is_active' => $this->resource->isActive(),
            'has_pending_application' => $this->resource->hasPendingApplication,
            'plan' => $membership ? new PlanSummaryResource($membership->plan) : null,
            'start_date' => $membership?->start_date?->toDateString(),
            'end_date' => $membership?->end_date?->toDateString(),
        ];
    }
}
