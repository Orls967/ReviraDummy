<?php

namespace Database\Factories;

use App\Enums\PaymentMethod;
use App\Enums\TransactionStatus;
use App\Models\Membership;
use App\Models\Transaction;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Transaction>
 */
class TransactionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'membership_id' => Membership::factory(),
            'user_id' => fn (array $attributes) => Membership::query()->findOrFail($attributes['membership_id'])->user_id,
            'amount' => fn (array $attributes) => Membership::query()->with('plan')->findOrFail($attributes['membership_id'])->plan->price,
            'payment_method' => PaymentMethod::OnTheSpot,
            'verification_status' => TransactionStatus::Pending,
        ];
    }
}
