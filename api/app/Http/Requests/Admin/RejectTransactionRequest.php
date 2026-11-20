<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\AdminRequest;
use App\Http\Requests\Concerns\SanitizesText;

class RejectTransactionRequest extends AdminRequest
{
    use SanitizesText;

    protected function prepareForValidation(): void
    {
        $this->sanitizeText(['reason']);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'reason' => ['required', 'string', 'max:255'],
        ];
    }

    public function reason(): string
    {
        return $this->string('reason')->trim()->value();
    }
}
