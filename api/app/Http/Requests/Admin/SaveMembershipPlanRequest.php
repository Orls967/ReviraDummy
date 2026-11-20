<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\AdminRequest;
use App\Http\Requests\Concerns\SanitizesText;
use App\Models\MembershipPlan;
use Illuminate\Validation\Rule;

class SaveMembershipPlanRequest extends AdminRequest
{
    use SanitizesText;

    protected function prepareForValidation(): void
    {
        $this->sanitizeText(['name', 'description']);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique(MembershipPlan::class, 'name')->ignore($this->route('membershipPlan')),
            ],
            'duration_days' => ['required', 'integer', 'min:1', 'max:3650'],
            'price' => ['required', 'integer', 'min:0', 'max:100000000'],
            'description' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
