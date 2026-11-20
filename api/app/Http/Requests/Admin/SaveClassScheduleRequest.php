<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\AdminRequest;

class SaveClassScheduleRequest extends AdminRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'gym_class_id' => ['required', 'integer', 'exists:gym_classes,id,is_active,1'],
            'instructor_id' => ['required', 'integer', 'exists:instructors,id,is_active,1'],
            'schedule_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
        ];
    }
}
