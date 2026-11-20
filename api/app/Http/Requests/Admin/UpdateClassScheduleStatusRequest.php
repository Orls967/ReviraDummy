<?php

namespace App\Http\Requests\Admin;

use App\Enums\ScheduleStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateClassScheduleStatusRequest extends FormRequest
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
