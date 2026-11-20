<?php

namespace App\Http\Requests\Concerns;

/**
 * Membuang tag HTML dari kolom teks bebas sebelum validasi. Frontend tetap meng-escape keluaran;
 * ini mencegah markup tersimpan di basis data dan ikut terbawa ke klien lain.
 */
trait SanitizesText
{
    /**
     * @param  list<string>  $fields
     */
    protected function sanitizeText(array $fields): void
    {
        $clean = [];

        foreach ($fields as $field) {
            $value = $this->input($field);

            if (is_string($value)) {
                $clean[$field] = trim(strip_tags($value));
            }
        }

        $this->merge($clean);
    }
}
