<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Membatasi route ke peran tertentu. Selalu dipasang setelah auth:sanctum, mis. "role:admin".
 */
class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user instanceof User || ! in_array($user->role->value, $roles, true)) {
            return response()->json(
                ['message' => 'Anda tidak memiliki akses ke sumber daya ini.'],
                JsonResponse::HTTP_FORBIDDEN,
            );
        }

        return $next($request);
    }
}
