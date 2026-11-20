<?php

namespace App\Services\Memberships;

use App\Enums\CurrentMembershipStatus;
use App\Models\Membership;

/**
 * Status membership terkini seorang member beserta membership yang menentukannya (null bila none).
 * hasPendingApplication tetap true walau status terkini active, mis. saat perpanjangan menunggu verifikasi.
 */
final readonly class MembershipSummary
{
    public function __construct(
        public CurrentMembershipStatus $status,
        public ?Membership $membership,
        public bool $hasPendingApplication = false,
    ) {}

    public function isActive(): bool
    {
        return $this->status === CurrentMembershipStatus::Active;
    }
}
