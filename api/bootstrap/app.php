<?php

use App\Http\Middleware\EnsureRole;
use App\Http\Middleware\SecurityHeaders;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        apiPrefix: 'api/v1',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->api(append: [SecurityHeaders::class]);

        $middleware->alias([
            'role' => EnsureRole::class,
        ]);

        // Aplikasi ini hanya API: tamu tidak pernah diarahkan ke halaman login, jadi request tanpa
        // header Accept JSON tetap mendapat 401 JSON, bukan error "Route [login] not defined".
        $middleware->redirectGuestsTo(fn () => null);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        $exceptions->render(function (NotFoundHttpException $exception, Request $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'Data tidak ditemukan.'], JsonResponse::HTTP_NOT_FOUND);
            }

            return null;
        });

        $exceptions->render(function (ThrottleRequestsException $exception, Request $request) {
            if ($request->is('api/*')) {
                return response()->json(
                    ['message' => 'Terlalu banyak permintaan. Coba lagi dalam beberapa saat.'],
                    JsonResponse::HTTP_TOO_MANY_REQUESTS,
                    $exception->getHeaders(),
                );
            }

            return null;
        });
    })->create();
