<?php

namespace App\Services\Auth;

use App\Enums\AuditAction;
use App\Models\User;
use App\Services\Audit\AuditLogger;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\NewAccessToken;
use Laravel\Sanctum\PersonalAccessToken;

class AuthService
{
    public function __construct(private readonly AuditLogger $audit) {}

    /**
     * Pesan gagal sama untuk email tak terdaftar dan kata sandi salah, dan hash tetap dihitung
     * saat email tidak ada, supaya keberadaan akun tidak bisa ditebak dari pesan atau waktu respons.
     *
     * @return array{token: string, expires_at: string, user: User}
     *
     * @throws ValidationException bila email atau kata sandi salah
     */
    public function login(string $email, string $password, string $deviceName): array
    {
        $user = User::query()->where('email', $email)->first();
        $hash = $user?->password ?? $this->dummyHash();

        if (! Hash::check($password, $hash) || $user === null) {
            throw ValidationException::withMessages(['email' => 'Email atau kata sandi salah.']);
        }

        if (Hash::needsRehash($user->password)) {
            $user->forceFill(['password' => $password])->save();
        }

        $user->tokens()->where('expires_at', '<', now())->delete();
        $token = $this->issueToken($user, $deviceName);

        if ($user->isAdmin()) {
            $this->audit->record($user, AuditAction::AdminLoggedIn, $user, ['device' => $deviceName]);
        }

        return [
            'token' => $token->plainTextToken,
            'expires_at' => $token->accessToken->expires_at->toIso8601String(),
            'user' => $user,
        ];
    }

    public function logout(User $user): void
    {
        $token = $user->currentAccessToken();

        if ($token instanceof PersonalAccessToken) {
            $token->delete();
        }
    }

    private function issueToken(User $user, string $deviceName): NewAccessToken
    {
        $ttl = config('security.token_ttl_minutes.'.$user->role->value);

        return $user->createToken($deviceName, ['*'], now()->addMinutes($ttl));
    }

    /**
     * Hash bcrypt dari string acak yang tidak disimpan di mana pun; hanya untuk menyamakan waktu respons.
     */
    private function dummyHash(): string
    {
        return '$2y$12$H6tgVpVgAedrPhXkzRqyguqnplELiT8elNo7iftoCBtzuN3GJHLNe';
    }
}
