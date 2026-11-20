<?php

namespace App\Services\Memberships;

use App\Enums\CurrentMembershipStatus;
use App\Enums\MembershipStatus;
use App\Models\Membership;
use App\Models\User;
use Carbon\CarbonInterface;
use Closure;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

/**
 * Satu sumber aturan status membership terkini, dipakai /me, daftar member admin, dan booking.
 *
 * Prioritas: active (berlaku pada tanggal itu) > pending > upcoming (disetujui, belum mulai) > expired > none.
 * Bila beberapa membership masuk kategori yang sama, yang menentukan adalah id terbesar (pengajuan terbaru).
 * predicates() dan scopes() harus selalu setara supaya tampilan dan filter database konsisten.
 */
class MembershipStatusResolver
{
    /**
     * @param  Collection<int, Membership>  $memberships
     */
    public function resolve(Collection $memberships, CarbonInterface $date): MembershipSummary
    {
        $hasPending = $memberships->contains(fn (Membership $membership) => $membership->status === MembershipStatus::Pending);

        foreach ($this->predicates($date) as $status => $matches) {
            $membership = $memberships->filter($matches)->sortByDesc('id')->first();

            if ($membership !== null) {
                return new MembershipSummary(CurrentMembershipStatus::from($status), $membership, $hasPending);
            }
        }

        return new MembershipSummary(CurrentMembershipStatus::None, null, $hasPending);
    }

    public function forUser(User $user, CarbonInterface $date): MembershipSummary
    {
        $user->load('memberships.plan');

        return $this->resolve($user->memberships, $date);
    }

    public function isActiveOn(User $user, CarbonInterface $date): bool
    {
        return $user->memberships()->activeOn($date)->exists();
    }

    /**
     * Scope query Membership per kategori, urut sesuai prioritas.
     *
     * @return array<string, Closure(Builder<Membership>): mixed>
     */
    public function scopes(CarbonInterface $date): array
    {
        return [
            CurrentMembershipStatus::Active->value => fn (Builder $query) => $query->activeOn($date),
            CurrentMembershipStatus::Pending->value => fn (Builder $query) => $query->pending(),
            CurrentMembershipStatus::Upcoming->value => fn (Builder $query) => $query->upcomingAfter($date),
            CurrentMembershipStatus::Expired->value => fn (Builder $query) => $query->lapsedBefore($date),
        ];
    }

    /**
     * @return array<string, Closure(Membership): bool>
     */
    private function predicates(CarbonInterface $date): array
    {
        $day = $date->toDateString();

        return [
            CurrentMembershipStatus::Active->value => fn (Membership $membership) => $membership->isActiveOn($date),
            CurrentMembershipStatus::Pending->value => fn (Membership $membership) => $membership->status === MembershipStatus::Pending,
            CurrentMembershipStatus::Upcoming->value => fn (Membership $membership) => $membership->status === MembershipStatus::Active
                && $membership->start_date->toDateString() > $day,
            CurrentMembershipStatus::Expired->value => fn (Membership $membership) => $membership->status === MembershipStatus::Expired
                || ($membership->status === MembershipStatus::Active && $membership->end_date?->toDateString() < $day),
        ];
    }
}
