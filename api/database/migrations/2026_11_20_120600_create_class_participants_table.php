<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('class_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_schedule_id')->constrained()->restrictOnDelete();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->string('status', 20)->default('booked');
            $table->timestamp('booked_at');
            $table->timestamps();

            $table->unique(['class_schedule_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('class_participants');
    }
};
