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
        $defaultEntrance = getenv('ESP32_CAM_ENTRANCE_STREAM_URL') ?: getenv('ESP32_CAM_STREAM_URL') ?: 'http://192.168.2.100:81/stream';
        $defaultExit = getenv('ESP32_CAM_EXIT_STREAM_URL') ?: 'http://192.168.2.105:81/stream';

        $status = static::query()->firstOrCreate([], [
            'gate_status' => 'closed',
            'camera_status' => 'offline',
            'entrance_camera_status' => 'offline',
            'exit_camera_status' => 'offline',
            'sensor_status' => 'online',
            'camera_stream_url' => $defaultEntrance,
            'entrance_camera_stream_url' => $defaultEntrance,
            'exit_camera_stream_url' => $defaultExit,
        ]);

        // Sync with .env changes if they differ
        if ($status->camera_stream_url !== $defaultEntrance || $status->entrance_camera_stream_url !== $defaultEntrance || $status->exit_camera_stream_url !== $defaultExit) {
            $status->update([
                'camera_stream_url' => $defaultEntrance,
                'entrance_camera_stream_url' => $defaultEntrance,
                'exit_camera_stream_url' => $defaultExit,
            ]);
        }

        return $status;
    }

    public function checkHealth(): void
    {
        $entranceUrl = $this->entrance_camera_stream_url ?: $this->camera_stream_url ?: getenv('ESP32_CAM_ENTRANCE_STREAM_URL') ?: getenv('ESP32_CAM_STREAM_URL') ?: 'http://192.168.2.100:81/stream';
        $exitUrl = $this->exit_camera_stream_url ?: getenv('ESP32_CAM_EXIT_STREAM_URL') ?: 'http://192.168.2.105:81/stream';

        $entranceStatus = $this->pingUrl($entranceUrl);
        $exitStatus = $this->pingUrl($exitUrl);

        $this->update([
            'entrance_camera_status' => $entranceStatus,
            'exit_camera_status' => $exitStatus,
            'camera_status' => $entranceStatus,
        ]);
    }

    private function pingUrl(?string $url): string
    {
        if (! $url) {
            return 'offline';
        }

        $parts = parse_url($url);
        $host = $parts['host'] ?? null;
        $scheme = $parts['scheme'] ?? 'http';
        $port = $parts['port'] ?? ($scheme === 'rtsp' ? 554 : 80);

        if (! $host) {
            return 'offline';
        }

        $connection = @fsockopen($host, $port, $errno, $errstr, 0.5);

        if (is_resource($connection)) {
            fclose($connection);
            return 'online';
        }

        return 'offline';
    }

    public static function getActivePlateInfo(string $direction): ?array
    {
        $log = \App\Models\GateLog::where('direction', strtolower($direction))
            ->orWhere('direction', strtoupper($direction))
            ->orderBy('gate_log_id', 'desc')
            ->first();

        $timestamp = $log?->created_at ?? $log?->logged_at;
        if ($log && $timestamp && $timestamp->diffInSeconds(now()) < 15) {
            return [
                'plate_number' => $log->plate_number,
                'status' => $log->status === 'granted' ? 'verified' : 'error',
                'authorized' => $log->status === 'granted',
                'resident_name' => $log->owner_name ?? ($log->resident ? ($log->resident->first_name . ' ' . $log->resident->last_name) : null),
                'car_model' => $log->car_model,
                'car_color' => $log->car_color,
            ];
        }

        return null;
    }
}
