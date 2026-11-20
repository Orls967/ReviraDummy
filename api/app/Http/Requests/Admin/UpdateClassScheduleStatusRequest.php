<?php

namespace App\Http\Requests\Admin;

use App\Enums\ScheduleStatus;
use App\Http\Requests\AdminRequest;
use App\Http\Requests\Concerns\SanitizesText;
use Illuminate\Validation\Rule;

class UpdateClassScheduleStatusRequest extends AdminRequest
{
    use SanitizesText;

    protected function prepareForValidation(): void
    {
        $this->sanitizeText(['cancel_reason']);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'status' => ['required', Rule::enum(ScheduleStatus::class)->except([ScheduleStatus::Scheduled])],
            'cancel_reason' => ['nullable', 'required_if:status,cancelled', 'string', 'max:255'],
        ];
    }

    public function targetStatus(): ScheduleStatus
    {
        return $this->enum('status', ScheduleStatus::class);
    }

    public function cancelReason(): ?string
    {
        return $this->filled('cancel_reason') ? $this->string('cancel_reason')->trim()->value() : null;
    }
}
