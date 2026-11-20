<?php

namespace App\Http\Requests\Admin;

use App\Enums\AuditAction;
use App\Http\Requests\AdminRequest;
use Illuminate\Validation\Rule;

class IndexAuditLogRequest extends AdminRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'action' => ['sometimes', 'nullable', Rule::enum(AuditAction::class)],
            'page' => ['sometimes', 'integer', 'min:1'],
        ];
    }

    public function action(): ?AuditAction
    {
        return $this->enum('action', AuditAction::class);
    }
}
