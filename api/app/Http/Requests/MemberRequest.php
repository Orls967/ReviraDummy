<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Lapisan kedua di samping middleware role:member.
 */
abstract class MemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isMember() ?? false;
    }
}
