<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

class AppServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->configureRateLimiting();
    }

    private function configureRateLimiting(): void
    {
        $limits = config('security.rate_limits');

        RateLimiter::for('login', fn (Request $request) => [
            Limit::perMinute($limits['login_per_account'])
                ->by('login:'.Str::lower((string) $request->input('email')).'|'.$request->ip()),
            Limit::perMinute($limits['login_per_ip'])->by('login-ip:'.$request->ip()),
        ]);

        RateLimiter::for('api', fn (Request $request) => Limit::perMinute($limits['api_per_user'])
            ->by($request->user()?->getAuthIdentifier() ?? $request->ip()));

        RateLimiter::for('member-actions', fn (Request $request) => Limit::perMinute($limits['member_actions_per_user'])
            ->by('member-actions:'.($request->user()?->getAuthIdentifier() ?? $request->ip())));
    }
}
