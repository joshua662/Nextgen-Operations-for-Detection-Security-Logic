<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbl_gate_logs', function (Blueprint $table) {
            $table->id('gate_log_id');
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('plate_number', 20);
            $table->string('owner_name', 155)->nullable();
            $table->string('car_model', 55)->nullable();
            $table->string('car_color', 55)->nullable();
            $table->enum('direction', ['IN', 'OUT']);
            $table->enum('status', ['authorized', 'unauthorized']);
            $table->string('capture_image', 255)->nullable();
            $table->timestamp('logged_at');
            $table->timestamps();

            $table->foreign('user_id')
                ->references('user_id')
                ->on('tbl_users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_gate_logs');
    }
};
