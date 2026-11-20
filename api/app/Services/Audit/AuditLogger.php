<?php

namespace App\Services\Audit;

use App\Enums\AuditAction;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class AuditLogger
{
    public const PER_PAGE = 20;

    /**
     * Kolom yang tidak pernah boleh masuk ke properties, apa pun yang dikirim pemanggil.
     */
    private const SECRET_KEYS = ['password', 'remember_token', 'token', 'plain_text_token', 'api_key', 'secret'];

    public function __construct(private readonly Request $request) {}

    /**
     * @param  array<string, mixed>  $properties
     */
    public function record(User $actor, AuditAction $action, Model $subject, array $properties = []): AuditLog
    {
        return AuditLog::query()->create([
            'actor_id' => $actor->id,
            'action' => $action,
            'subject_type' => $subject->getTable(),
            'subject_id' => $subject->getKey(),
            'properties' => $this->withoutSecrets($properties) ?: null,
            'ip_address' => $this->request->ip(),
        ]);
    }

    /**
     * Selisih nilai lama dan baru dari model yang baru disimpan, hanya untuk kolom yang diizinkan.
     *
     * @param  list<string>  $fields
     * @return array<string, array{from: mixed, to: mixed}>
     */
    public function changes(Model $model, array $fields): array
    {
        $changes = [];
        $previous = $model->getPrevious();
        $current = $model->getAttributes();

        foreach ($fields as $field) {
            if ($model->wasChanged($field)) {
                $changes[$field] = ['from' => $previous[$field] ?? null, 'to' => $current[$field] ?? null];
            }
        }

        return $changes;
    }

    /**
     * @return LengthAwarePaginator<int, AuditLog>
     */
    public function paginate(?AuditAction $action): LengthAwarePaginator
    {
        return AuditLog::query()
            ->with('actor')
            ->when($action, fn ($query) => $query->where('action', $action->value))
            ->latest('id')
            ->paginate(self::PER_PAGE)
            ->withQueryString();
    }

    /**
     * @param  array<string, mixed>  $properties
     * @return array<string, mixed>
     */
    private function withoutSecrets(array $properties): array
    {
        $clean = [];

        foreach ($properties as $key => $value) {
            if (in_array(strtolower((string) $key), self::SECRET_KEYS, true)) {
                continue;
            }

            $clean[$key] = is_array($value) ? $this->withoutSecrets($value) : $value;
        }

        return $clean;
    }
}
