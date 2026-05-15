<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbl_system_status', function (Blueprint $table) {
            $table->id('system_status_id');
            $table->enum('gate_status', ['open', 'closed'])->default('closed');
            $table->enum('camera_status', ['online', 'offline'])->default('offline');
            $table->enum('sensor_status', ['online', 'offline'])->default('online');
            $table->string('camera_stream_url', 500)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_system_status');
    }
};
