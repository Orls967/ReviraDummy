<?php

namespace App\Services\Members;

use App\Enums\CurrentMembershipStatus;
use App\Models\Membership;
use App\Models\User;
use App\Services\Memberships\MembershipStatusResolver;
use Carbon\CarbonInterface;
use Closure;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

/**
 * Daftar member untuk admin. Filter status dan paket dijalankan di database supaya paginasi benar,
 * memakai kategori yang sama dengan MembershipStatusResolver.
 */
class MemberDirectory
{
    public const PER_PAGE = 15;

    public function __construct(private readonly MembershipStatusResolver $resolver) {}

    /**
     * @return LengthAwarePaginator<int, User>
     */
    public function paginate(
        CarbonInterface $today,
        ?CurrentMembershipStatus $status = null,
        ?int $planId = null,
        ?string $search = null,
    ): LengthAwarePaginator {
        $scopes = $this->resolver->scopes($today);

        $query = User::query()
            ->members()
            ->with('memberships.plan');

        if ($search !== null && trim($search) !== '') {
            $this->whereSearch($query, trim($search));
        }

        if ($planId !== null) {
            $this->wherePlan($query, $planId, $status, $scopes);
        } elseif ($status !== null) {
            $this->whereStatus($query, $status, $scopes);
        }

        return $query->orderBy('name')
            ->orderBy('id')
            ->paginate(self::PER_PAGE)
            ->withQueryString();
    }

    /**
     * Status terkini = kategori pertama (urut prioritas) yang dimiliki member.
     *
     * @param  Builder<User>  $query
     * @param  array<string, Closure(Builder<Membership>): mixed>  $scopes
     */
    private function whereStatus(Builder $query, CurrentMembershipStatus $status, array $scopes): void
    {
        foreach ($scopes as $category => $scope) {
            if ($category === $status->value) {
                $query->whereHas('memberships', $scope);

                return;
            }

            $query->whereDoesntHave('memberships', $scope);
        }
    }

    /**
     * Paket yang difilter adalah paket pada membership penentu status (id terbesar di kategorinya).
     *
     * @param  Builder<User>  $query
     * @param  array<string, Closure(Builder<Membership>): mixed>  $scopes
     */
    private function wherePlan(Builder $query, int $planId, ?CurrentMembershipStatus $status, array $scopes): void
    {
        $categories = $status === null ? array_keys($scopes) : [$status->value];

        $query->where(function (Builder $query) use ($categories, $planId, $scopes) {
            // Status none tidak punya paket, jadi filter paket tanpa kategori lain menghasilkan daftar kosong.
            $query->whereRaw('1 = 0');

            foreach ($categories as $category) {
                if (! isset($scopes[$category])) {
                    continue;
                }

                $query->orWhere(function (Builder $query) use ($category, $planId, $scopes) {
                    $this->whereStatus($query, CurrentMembershipStatus::from($category), $scopes);
                    $query->whereHas('memberships', fn (Builder $membership) => $membership
                        ->where('membership_plan_id', $planId)
                        ->where('memberships.id', $this->latestIdInCategory($scopes[$category])));
                });
            }
        });
    }

    /**
     * Subquery id membership terbaru milik user yang sama dalam satu kategori.
     * Kolom tanpa prefix di dalam scope merujuk ke alias "candidates".
     *
     * @param  Closure(Builder<Membership>): mixed  $scope
     * @return Builder<Membership>
     */
    private function latestIdInCategory(Closure $scope): Builder
    {
        $subquery = Membership::query()
            ->from('memberships', 'candidates')
            ->selectRaw('MAX(candidates.id)')
            ->whereColumn('candidates.user_id', 'memberships.user_id');

        $scope($subquery);

        return $subquery;
    }

    /**
     * Karakter % dan _ dicari apa adanya; '!' dipakai sebagai karakter escape yang berlaku di SQLite dan MySQL.
     *
     * @param  Builder<User>  $query
     */
    private function whereSearch(Builder $query, string $search): void
    {
        $pattern = '%'.str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $search).'%';

        $query->where(function (Builder $query) use ($pattern) {
            foreach (['name', 'email', 'phone_number'] as $column) {
                $query->orWhereRaw("{$column} LIKE ? ESCAPE '!'", [$pattern]);
            }
        });
    }
}
