<?php

use App\Http\Controllers\Api\V1\Admin\AuditLogController;
use App\Http\Controllers\Api\V1\Admin\CatalogController;
use App\Http\Controllers\Api\V1\Admin\ClassScheduleController as AdminClassScheduleController;
use App\Http\Controllers\Api\V1\Admin\MemberController;
use App\Http\Controllers\Api\V1\Admin\MembershipPlanController;
use App\Http\Controllers\Api\V1\Admin\TransactionController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\MeController;
use App\Http\Controllers\Api\V1\Member\BookingController;
use App\Http\Controllers\Api\V1\Member\ClassScheduleController as MemberClassScheduleController;
use App\Http\Controllers\Api\V1\Member\MembershipController;
use App\Http\Controllers\Api\V1\PublicMembershipPlanController;
use Illuminate\Support\Facades\Route;

// Semua route memakai rate limit; batasnya diatur di config/security.php.
Route::middleware('throttle:api')->group(function () {
    Route::get('/health', HealthController::class);
    Route::get('/membership-plans', PublicMembershipPlanController::class);
});

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');

Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', MeController::class);
});

Route::middleware(['auth:sanctum', 'throttle:api', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::apiResource('membership-plans', MembershipPlanController::class)
        ->parameters(['membership-plans' => 'membershipPlan'])
        ->whereNumber('membershipPlan');

    Route::get('/members', [MemberController::class, 'index']);

    Route::get('/transactions', [TransactionController::class, 'index']);
    Route::post('/transactions/{transaction}/approve', [TransactionController::class, 'approve'])->whereNumber('transaction');
    Route::post('/transactions/{transaction}/reject', [TransactionController::class, 'reject'])->whereNumber('transaction');

    Route::apiResource('class-schedules', AdminClassScheduleController::class)
        ->parameters(['class-schedules' => 'classSchedule'])
        ->whereNumber('classSchedule');
    Route::patch('/class-schedules/{classSchedule}/status', [AdminClassScheduleController::class, 'updateStatus'])
        ->whereNumber('classSchedule');

    Route::get('/classes', [CatalogController::class, 'classes']);
    Route::get('/instructors', [CatalogController::class, 'instructors']);

    Route::get('/audit-logs', [AuditLogController::class, 'index']);
});

Route::middleware(['auth:sanctum', 'throttle:api', 'role:member'])->prefix('member')->group(function () {
    Route::get('/memberships', [MembershipController::class, 'index']);
    Route::post('/memberships', [MembershipController::class, 'store'])->middleware('throttle:member-actions');

    Route::get('/class-schedules', [MemberClassScheduleController::class, 'index']);
    Route::get('/class-schedules/{classSchedule}', [MemberClassScheduleController::class, 'show'])->whereNumber('classSchedule');
    Route::post('/class-schedules/{classSchedule}/booking', [BookingController::class, 'store'])
        ->whereNumber('classSchedule')
        ->middleware('throttle:member-actions');
    Route::delete('/class-schedules/{classSchedule}/booking', [BookingController::class, 'destroy'])
        ->whereNumber('classSchedule')
        ->middleware('throttle:member-actions');

    Route::get('/bookings', [BookingController::class, 'index']);
});
