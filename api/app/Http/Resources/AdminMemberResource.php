<?php

namespace App\Http\Resources;

use App\Models\User;
use App\Services\Memberships\MembershipStatusResolver;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Baris daftar member admin. Paket dan periode diambil dari membership penentu status;
 * user harus sudah memuat memberships.plan supaya tidak terjadi N+1.
 *
 * @mixin User
 */
class AdminMemberResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $summary = app(MembershipStatusResolver::class)->resolve($this->memberships, today());
        $membership = $summary->membership;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone_number' => $this->phone_number,
            'membership_status' => $summary->status->value,
            'plan' => $membership ? new PlanSummaryResource($membership->plan) : null,
            'start_date' => $membership?->start_date?->toDateString(),
            'end_date' => $membership?->end_date?->toDateString(),
            'registered_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
