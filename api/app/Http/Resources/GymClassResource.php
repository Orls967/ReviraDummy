<?php

namespace App\Http\Resources;

use App\Models\GymClass;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin GymClass
 */
class GymClassResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'min_participants' => $this->min_participants,
            'default_instructor_id' => $this->default_instructor_id,
        ];
    }
}
