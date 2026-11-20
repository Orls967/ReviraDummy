<?php

namespace App\Http\Resources;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Alamat IP sengaja tidak dikirim ke klien; tetap tersimpan untuk penelusuran di server.
 *
 * @mixin AuditLog
 */
class AuditLogResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'action' => $this->action->value,
            'action_label' => $this->action->label(),
            'actor' => $this->actor ? ['id' => $this->actor->id, 'name' => $this->actor->name] : null,
            'subject_type' => $this->subject_type,
            'subject_id' => $this->subject_id,
            'properties' => $this->properties ?? (object) [],
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
