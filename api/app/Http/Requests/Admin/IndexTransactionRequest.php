<?php

namespace App\Http\Requests\Admin;

use App\Enums\TransactionStatus;
use App\Http\Requests\AdminRequest;
use Illuminate\Validation\Rule;

class IndexTransactionRequest extends AdminRequest
{
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
