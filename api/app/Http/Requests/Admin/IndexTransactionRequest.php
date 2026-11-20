<?php

namespace App\Http\Requests\Admin;

use App\Enums\TransactionStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexTransactionRequest extends FormRequest
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
            'status' => ['sometimes', 'nullable', Rule::enum(TransactionStatus::class)],
            'page' => ['sometimes', 'integer', 'min:1'],
        ];
    }

    public function status(): ?TransactionStatus
    {
        return $this->enum('status', TransactionStatus::class);
    }
}
