<?php

namespace App\Http\Requests\Member;

use App\Enums\PaymentMethod;
use App\Http\Requests\MemberRequest;
use App\Models\MembershipPlan;
use Carbon\CarbonImmutable;
use Illuminate\Validation\Rule;

class StoreMembershipRequest extends MemberRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'membership_plan_id' => ['required', 'integer', 'exists:membership_plans,id,is_active,1'],
            'start_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'payment_method' => ['required', Rule::enum(PaymentMethod::class)],
        ];
    }

    public function plan(): MembershipPlan
    {
        return MembershipPlan::query()->findOrFail($this->integer('membership_plan_id'));
    }

    public function startDate(): CarbonImmutable
    {
        return CarbonImmutable::createFromFormat('!Y-m-d', $this->string('start_date')->value());
    }

    public function paymentMethod(): PaymentMethod
    {
        return $this->enum('payment_method', PaymentMethod::class);
    }
}
