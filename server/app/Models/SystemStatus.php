<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemStatus extends Model
{
    protected $table = 'tbl_system_status';

    protected $primaryKey = 'system_status_id';

    protected $fillable = [
        'gate_status',
        'camera_status',
        'entrance_camera_status',
        'exit_camera_status',
        'sensor_status',
        'camera_stream_url',
        'entrance_camera_stream_url',
        'exit_camera_stream_url',
    ];

    public static function current(): self
    {
        return static::query()->firstOrCreate([], [
            'gate_status' => 'closed',
            'camera_status' => 'offline',
            'entrance_camera_status' => 'offline',
            'exit_camera_status' => 'offline',
            'sensor_status' => 'online',
            'camera_stream_url' => env('ESP32_CAM_ENTRANCE_STREAM_URL', env('ESP32_CAM_STREAM_URL', 'http://192.168.2.104:81/stream')),
            'entrance_camera_stream_url' => env('ESP32_CAM_ENTRANCE_STREAM_URL', env('ESP32_CAM_STREAM_URL', 'http://192.168.2.104:81/stream')),
            'exit_camera_stream_url' => env('ESP32_CAM_EXIT_STREAM_URL', 'http://192.168.2.105:81/stream'),
        ]);
    }
}
