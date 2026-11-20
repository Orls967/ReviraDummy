<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Hasil login: bearer token dan profil user. Resource membungkus array {token, user}.
 */
class AuthSessionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'token' => $this->resource['token'],
            'token_type' => 'Bearer',
            'expires_at' => $this->resource['expires_at'],
            'user' => new UserResource($this->resource['user']),
        ];
    }
}
