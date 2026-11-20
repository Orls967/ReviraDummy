<?php

namespace App\Http\Resources;

use App\Models\User;
use App\Services\Memberships\MembershipSummary;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Profil user yang sedang login. membership hanya terisi untuk member.
 */
class MeResource extends JsonResource
{
    public function __construct(User $user, private readonly ?MembershipSummary $summary)
    {
        parent::__construct($user);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            ...(new UserResource($this->resource))->toArray($request),
            'membership' => $this->summary ? new MembershipSummaryResource($this->summary) : null,
        ];
    }
}
