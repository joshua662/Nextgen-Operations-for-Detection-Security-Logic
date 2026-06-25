<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tbl_users', function (Blueprint $table) {
            $table->string('rfid_card_uid', 50)->nullable()->unique()->after('car_color');
        });

        // Automatically configure the working ESP32-CAM stream URL on port 81
        \Illuminate\Support\Facades\DB::table('tbl_system_status')->updateOrInsert(
            [],
            [
                'camera_stream_url' => 'http://192.168.2.104:81/stream',
                'camera_status' => 'online',
                'sensor_status' => 'online',
                'gate_status' => 'closed',
            ]
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tbl_users', function (Blueprint $table) {
            $table->dropColumn('rfid_card_uid');
        });
    }
};
