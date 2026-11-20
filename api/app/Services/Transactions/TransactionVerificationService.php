<?php

namespace App\Services\Transactions;

use App\Enums\MembershipStatus;
use App\Enums\TransactionStatus;
use App\Exceptions\ConflictException;
use App\Models\Membership;
use App\Models\Transaction;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class TransactionVerificationService
{
    public const PER_PAGE = 15;

    /**
     * @return LengthAwarePaginator<int, Transaction>
     */
    public function paginate(?TransactionStatus $status): LengthAwarePaginator
    {
        return Transaction::query()
            ->with(['user', 'membership.plan'])
            ->when($status, fn ($query) => $query->where('verification_status', $status->value))
            ->latest('id')
            ->paginate(self::PER_PAGE)
            ->withQueryString();
    }

    /**
     * Setujui pembayaran dan aktifkan membership. Tanggal mulai yang sudah lewat digeser ke hari ini;
     * end_date inklusif = start_date + durasi paket - 1.
     *
     * @throws ConflictException bila transaksi sudah diproses atau periode bertabrakan
     */
    public function approve(Transaction $transaction, User $admin): Transaction
    {
        return DB::transaction(function () use ($transaction, $admin) {
            [$transaction, $membership] = $this->lockPending($transaction);

            $today = CarbonImmutable::today();
            $requestedStart = CarbonImmutable::parse($membership->start_date->toDateString());
            $startDate = $requestedStart->lessThan($today) ? $today : $requestedStart;
            $endDate = $startDate->addDays($membership->plan->duration_days - 1);

            $overlaps = Membership::query()
                ->where('user_id', $membership->user_id)
                ->whereKeyNot($membership->id)
                ->overlappingActive($startDate, $endDate)
                ->exists();

            if ($overlaps) {
                throw new ConflictException('Periode membership bertabrakan dengan membership aktif lain milik member ini.');
            }

            $membership->update([
                'status' => MembershipStatus::Active,
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
            ]);

            $transaction->update([
                'verification_status' => TransactionStatus::Verified,
                'verified_by' => $admin->id,
                'verified_at' => now(),
                'reject_reason' => null,
            ]);

            return $transaction->load(['user', 'membership.plan']);
        });
    }

    /**
     * @throws ConflictException bila transaksi sudah diproses
     */
    public function reject(Transaction $transaction, User $admin, string $reason): Transaction
    {
        return DB::transaction(function () use ($transaction, $admin, $reason) {
            [$transaction, $membership] = $this->lockPending($transaction);

            $membership->update(['status' => MembershipStatus::Rejected]);

            $transaction->update([
                'verification_status' => TransactionStatus::Rejected,
                'verified_by' => $admin->id,
                'verified_at' => now(),
                'reject_reason' => $reason,
            ]);

            return $transaction->load(['user', 'membership.plan']);
        });
    }

    /**
     * Ambil ulang transaksi dan membership-nya dengan baris terkunci supaya dua admin
     * tidak bisa memproses transaksi yang sama bersamaan.
     *
     * @return array{0: Transaction, 1: Membership}
     */
    private function lockPending(Transaction $transaction): array
    {
        $transaction = Transaction::query()->whereKey($transaction->id)->lockForUpdate()->firstOrFail();
        $membership = Membership::query()->with('plan')->whereKey($transaction->membership_id)->lockForUpdate()->firstOrFail();

        if ($transaction->verification_status !== TransactionStatus::Pending || $membership->status !== MembershipStatus::Pending) {
            throw new ConflictException('Transaksi ini sudah diproses sebelumnya.');
        }

        return [$transaction, $membership];
    }
}
