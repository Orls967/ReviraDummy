<?php

namespace App\Http\Resources;

use App\Models\ClassSchedule;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Muat lewat scope withDetails() (dan withBookingFlag() untuk member) agar tidak ada query per baris.
 * participants_count hanya menghitung booking yang tidak dibatalkan.
 *
 * @mixin ClassSchedule
 */
class ClassScheduleResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'class' => [
                'id' => $this->gymClass->id,
                'name' => $this->gymClass->name,
                'description' => $this->gymClass->description,
            ],
            'instructor' => [
                'id' => $this->instructor->id,
                'name' => $this->instructor->name,
            ],
            'schedule_date' => $this->schedule_date->toDateString(),
            'start_time' => substr($this->start_time, 0, 5),
            'end_time' => substr($this->end_time, 0, 5),
            'status' => $this->status->value,
            'display_status' => $this->displayStatus(now())->value,
            'cancel_reason' => $this->cancel_reason,
            'participants_count' => (int) $this->participants_count,
            'min_participants' => $this->gymClass->min_participants,
            'is_booked' => $this->when(
                array_key_exists('is_booked', $this->resource->getAttributes()),
                fn () => (bool) $this->is_booked,
            ),
            'participants' => ParticipantResource::collection($this->whenLoaded('bookedParticipants')),
        ];
    }
}
