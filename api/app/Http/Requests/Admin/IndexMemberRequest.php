<?php

namespace App\Http\Requests\Admin;

use App\Enums\CurrentMembershipStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'status' => ['sometimes', 'nullable', Rule::enum(CurrentMembershipStatus::class)],
            'membership_plan_id' => ['sometimes', 'nullable', 'integer', 'exists:membership_plans,id'],
            'search' => ['sometimes', 'nullable', 'string', 'max:100'],
            'page' => ['sometimes', 'integer', 'min:1'],
        ];
    }

    public function status(): ?CurrentMembershipStatus
    {
        return $this->enum('status', CurrentMembershipStatus::class);
    }

    public function planId(): ?int
    {
        return $this->filled('membership_plan_id') ? $this->integer('membership_plan_id') : null;
    }

    public function search(): ?string
    {
        return $this->filled('search') ? $this->string('search')->value() : null;
    }
}
