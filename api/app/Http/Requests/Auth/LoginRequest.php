<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
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
            'email' => ['required', 'string', 'email', 'max:150'],
            'password' => ['required', 'string', 'max:255'],
            'device_name' => ['sometimes', 'nullable', 'string', 'max:100'],
        ];
    }

    public function deviceName(): string
    {
        return $this->string('device_name')->trim()->value() ?: 'api';
    }
}
