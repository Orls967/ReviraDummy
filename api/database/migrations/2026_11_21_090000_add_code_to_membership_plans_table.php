<?php

use App\Services\Plans\StandardPlanCatalog;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Menambah kode stabil untuk paket standar, lalu memperbarui harga paket standar yang sudah ada
 * ke katalog terbaru. Tidak ada baris yang dihapus; paket buatan admin dan transaksi lama tidak berubah.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('membership_plans', function (Blueprint $table) {
            $table->string('code', 40)->nullable()->unique()->after('id');
        });

        $catalog = app(StandardPlanCatalog::class);

        if ($catalog->hasStandardPlans()) {
            $catalog->sync();
        }
    }

    public function down(): void
    {
        Schema::table('membership_plans', function (Blueprint $table) {
            $table->dropUnique(['code']);
            $table->dropColumn('code');
        });
    }
};
