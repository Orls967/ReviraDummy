<?php

namespace Tests\Unit;

use App\Enums\CurrentMembershipStatus;
use App\Enums\MembershipStatus;
use App\Models\Membership;
use App\Services\Memberships\MembershipStatusResolver;
use Carbon\CarbonImmutable;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class MembershipStatusResolverTest extends TestCase
{
    private function membership(int $id, MembershipStatus $status, string $start, ?string $end = null): Membership
    {
        $membership = new Membership;
        $membership->forceFill([
            'id' => $id,
            'status' => $status,
            'start_date' => $start,
            'end_date' => $end,
        ]);

        return $membership;
    }

    /**
     * @return iterable<string, array{list<array{int, MembershipStatus, string, string|null}>, CurrentMembershipStatus, int|null}>
     */
    public static function cases(): iterable
    {
        yield 'tanpa membership' => [[], CurrentMembershipStatus::None, null];
        yield 'hanya ditolak' => [[[1, MembershipStatus::Rejected, '2026-11-01', null]], CurrentMembershipStatus::None, null];
        yield 'aktif hari ini' => [[[1, MembershipStatus::Active, '2026-11-01', '2026-11-30']], CurrentMembershipStatus::Active, 1];
        yield 'hari terakhir masih aktif' => [[[1, MembershipStatus::Active, '2026-10-22', '2026-11-20']], CurrentMembershipStatus::Active, 1];
        yield 'aktif mengalahkan pending' => [[
            [1, MembershipStatus::Active, '2026-11-01', '2026-11-30'],
            [2, MembershipStatus::Pending, '2026-12-01', null],
        ], CurrentMembershipStatus::Active, 1];
        yield 'pending mengalahkan upcoming' => [[
            [1, MembershipStatus::Active, '2026-12-01', '2026-12-30'],
            [2, MembershipStatus::Pending, '2027-01-01', null],
        ], CurrentMembershipStatus::Pending, 2];
        yield 'disetujui tetapi belum mulai' => [[[1, MembershipStatus::Active, '2026-11-21', '2026-12-20']], CurrentMembershipStatus::Upcoming, 1];
        yield 'active yang lewat dianggap expired' => [[[1, MembershipStatus::Active, '2026-10-01', '2026-10-30']], CurrentMembershipStatus::Expired, 1];
        yield 'expired terbaru yang menentukan' => [[
            [1, MembershipStatus::Expired, '2026-08-01', '2026-08-30'],
            [2, MembershipStatus::Expired, '2026-09-01', '2026-09-30'],
        ], CurrentMembershipStatus::Expired, 2];
    }

    /**
     * @param  list<array{int, MembershipStatus, string, string|null}>  $rows
     */
    #[DataProvider('cases')]
    public function test_resolves_current_status(array $rows, CurrentMembershipStatus $expected, ?int $expectedId): void
    {
        $memberships = collect($rows)->map(fn (array $row) => $this->membership(...$row));

        $summary = (new MembershipStatusResolver)->resolve($memberships, CarbonImmutable::parse('2026-11-20'));

        $this->assertSame($expected, $summary->status);
        $this->assertSame($expectedId, $summary->membership?->id);
        $this->assertSame($expected === CurrentMembershipStatus::Active, $summary->isActive());
    }
}
