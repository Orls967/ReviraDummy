<?php

namespace App\Exceptions;

use Illuminate\Http\JsonResponse;
use RuntimeException;

/**
 * Permintaan valid tetapi bertabrakan dengan keadaan data saat ini (HTTP 409).
 */
class ConflictException extends RuntimeException
{
    public function render(): JsonResponse
    {
        return response()->json(['message' => $this->getMessage()], JsonResponse::HTTP_CONFLICT);
    }
}
