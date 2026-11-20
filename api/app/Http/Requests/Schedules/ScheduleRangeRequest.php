<?php

namespace App\Http\Requests\Schedules;

use Carbon\CarbonImmutable;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * Rentang tanggal daftar jadwal. Bawaan: hari ini sampai enam hari ke depan; maksimal 31 hari.
 */
class ScheduleRangeRequest extends FormRequest
{
    private const DEFAULT_DAYS = 7;

    private const MAX_DAYS = 31;

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
            'from' => ['sometimes', 'date_format:Y-m-d'],
            'to' => ['sometimes', 'date_format:Y-m-d', 'after_or_equal:from'],
        ];
    }

    /**
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                if ($this->from()->diffInDays($this->to()) >= self::MAX_DAYS) {
                    $validator->errors()->add('to', 'Rentang tanggal maksimal '.self::MAX_DAYS.' hari.');
                }
            },
        ];
    }

    public function from(): CarbonImmutable
    {
        return $this->filled('from')
            ? CarbonImmutable::createFromFormat('!Y-m-d', $this->string('from')->value())
            : CarbonImmutable::today();
    }

    public function to(): CarbonImmutable
    {
        return $this->filled('to')
            ? CarbonImmutable::createFromFormat('!Y-m-d', $this->string('to')->value())
            : $this->from()->addDays(self::DEFAULT_DAYS - 1);
    }
}
