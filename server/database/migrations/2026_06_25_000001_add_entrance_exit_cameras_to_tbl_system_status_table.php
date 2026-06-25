<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tbl_system_status', function (Blueprint $table) {
            $table->enum('entrance_camera_status', ['online', 'offline'])->default('offline')->after('camera_status');
            $table->enum('exit_camera_status', ['online', 'offline'])->default('offline')->after('entrance_camera_status');
            $table->string('entrance_camera_stream_url', 500)->nullable()->after('camera_stream_url');
            $table->string('exit_camera_stream_url', 500)->nullable()->after('entrance_camera_stream_url');
        });

        $existing = DB::table('tbl_system_status')->first();

        if ($existing) {
            DB::table('tbl_system_status')->update([
                'entrance_camera_stream_url' => $existing->camera_stream_url
                    ?? env('ESP32_CAM_ENTRANCE_STREAM_URL', 'http://192.168.2.104:81/stream'),
                'exit_camera_stream_url' => env('ESP32_CAM_EXIT_STREAM_URL', 'http://192.168.2.105:81/stream'),
                'entrance_camera_status' => $existing->camera_status ?? 'offline',
                'exit_camera_status' => 'offline',
            ]);
        } else {
            DB::table('tbl_system_status')->insert([
                'gate_status' => 'closed',
                'camera_status' => 'offline',
                'entrance_camera_status' => 'offline',
                'exit_camera_status' => 'offline',
                'sensor_status' => 'online',
                'camera_stream_url' => env('ESP32_CAM_ENTRANCE_STREAM_URL', 'http://192.168.2.104:81/stream'),
                'entrance_camera_stream_url' => env('ESP32_CAM_ENTRANCE_STREAM_URL', 'http://192.168.2.104:81/stream'),
                'exit_camera_stream_url' => env('ESP32_CAM_EXIT_STREAM_URL', 'http://192.168.2.105:81/stream'),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('tbl_system_status', function (Blueprint $table) {
            $table->dropColumn([
                'entrance_camera_status',
                'exit_camera_status',
                'entrance_camera_stream_url',
                'exit_camera_stream_url',
            ]);
        });
    }
};
