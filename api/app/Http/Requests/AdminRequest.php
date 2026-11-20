<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Lapisan kedua di samping middleware role:admin, supaya request admin tetap ditolak
 * bila suatu saat dipasang di route tanpa middleware yang benar.
 */
abstract class AdminRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }
}
