<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemStatus;
use App\Services\GateService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\PersonalAccessToken;

class GateController extends Controller
{
    public function status()
    {
        $system = SystemStatus::current();
        $system->checkHealth();
        $system->refresh();

        $entranceUrl = $system->entrance_camera_stream_url ?: $system->camera_stream_url ?: env('ESP32_CAM_ENTRANCE_STREAM_URL', env('ESP32_CAM_STREAM_URL', 'http://192.168.2.100:81/stream'));
        $exitUrl = $system->exit_camera_stream_url ?: env('ESP32_CAM_EXIT_STREAM_URL', env('ESP32_CAM_STREAM_URL', 'http://192.168.2.105:81/stream'));

        return response()->json([
            'gate_status' => $system->gate_status,
            'camera_status' => $system->entrance_camera_status,
            'entrance_camera_status' => $system->entrance_camera_status,
            'exit_camera_status' => $system->exit_camera_status,
            'sensor_status' => $system->sensor_status,
            'camera_stream_url' => $entranceUrl,
            'entrance_camera_stream_url' => $entranceUrl,
            'exit_camera_stream_url' => $exitUrl,
            'entrance_active_plate' => SystemStatus::getActivePlateInfo('IN'),
            'exit_active_plate' => SystemStatus::getActivePlateInfo('OUT'),
        ]);
    }

    public function verify(Request $request)
    {
        $validated = $request->validate([
            'plate_number' => ['required_without:rfid_card_uid', 'nullable', 'string', 'max:20'],
            'rfid_card_uid' => ['required_without:plate_number', 'nullable', 'string', 'max:50'],
            'direction' => ['nullable', 'in:IN,OUT,in,out'],
            'capture_image' => ['nullable', 'image', 'mimes:png,jpg,jpeg'],
        ]);

        $result = GateService::verifyAccess(
            $validated['plate_number'] ?? null,
            $validated['rfid_card_uid'] ?? null,
            $validated['direction'] ?? null,
            $request->file('capture_image')
        );

        return response()->json($result, 200);
    }

    public function toggleGate(Request $request)
    {
        $validated = $request->validate([
            'gate_status' => ['required', 'in:open,closed'],
        ]);

        $system = SystemStatus::current();
        $system->update(['gate_status' => $validated['gate_status']]);

        return response()->json([
            'message' => 'Gate status updated.',
            'gate_status' => $system->gate_status,
        ]);
    }

    public function updateSystemHealth(Request $request)
    {
        $validated = $request->validate([
            'camera_status' => ['nullable', 'in:online,offline'],
            'entrance_camera_status' => ['nullable', 'in:online,offline'],
            'exit_camera_status' => ['nullable', 'in:online,offline'],
            'sensor_status' => ['nullable', 'in:online,offline'],
            'camera_stream_url' => ['nullable', 'string', 'max:500'],
            'entrance_camera_stream_url' => ['nullable', 'string', 'max:500'],
            'exit_camera_stream_url' => ['nullable', 'string', 'max:500'],
        ]);

        $system = SystemStatus::current();

        if (isset($validated['entrance_camera_stream_url'])) {
            $validated['camera_stream_url'] = $validated['entrance_camera_stream_url'];
        }
        if (isset($validated['entrance_camera_status'])) {
            $validated['camera_status'] = $validated['entrance_camera_status'];
        }
        if (isset($validated['camera_stream_url']) && ! isset($validated['entrance_camera_stream_url'])) {
            $validated['entrance_camera_stream_url'] = $validated['camera_stream_url'];
        }
        if (isset($validated['camera_status']) && ! isset($validated['entrance_camera_status'])) {
            $validated['entrance_camera_status'] = $validated['camera_status'];
        }

        $system->update(array_filter($validated));

        return response()->json(['system' => $system], 200);
    }

    public function checkPlate(Request $request)
    {
        $validated = $request->validate([
            'plate_number' => ['required', 'string', 'max:20'],
        ]);

        return response()->json(
            GateService::checkPlateRegistration($validated['plate_number']),
            200
        );
    }

    public function cameraSnapshot(Request $request)
    {
        $validated = $request->validate([
            'location' => ['required', 'in:entrance,exit'],
        ]);

        $filename = $validated['location'] === 'exit' ? 'camera_exit.jpg' : 'camera_entrance.jpg';
        $localPath = public_path($filename);

        if (file_exists($localPath)) {
            clearstatcache(true, $localPath);
            if (time() - filemtime($localPath) < 10) {
                return response()->file($localPath, [
                    'Content-Type' => 'image/jpeg',
                    'Cache-Control' => 'no-store, no-cache, must-revalidate',
                    'Pragma' => 'no-cache',
                ]);
            }
        }

        $system = SystemStatus::current();
        $streamUrl = $validated['location'] === 'exit'
            ? ($system->exit_camera_stream_url ?: env('ESP32_CAM_EXIT_STREAM_URL', 'http://192.168.2.105:81/stream'))
            : ($system->entrance_camera_stream_url ?: $system->camera_stream_url ?: env('ESP32_CAM_ENTRANCE_STREAM_URL', env('ESP32_CAM_STREAM_URL', 'http://192.168.2.100:81/stream')));

        if (! $streamUrl) {
            return response()->json(['message' => 'No camera configured for this location.'], 404);
        }

        $parts = parse_url($streamUrl);
        $host = $parts['host'] ?? null;
        $port = $parts['port'] ?? 80;
        $online = false;

        if ($host) {
            $connection = @fsockopen($host, $port, $errno, $errstr, 1.0);
            if (is_resource($connection)) {
                fclose($connection);
                $online = true;
            }
        }

        if (!$online) {
            return response()->json(['message' => 'Camera is offline or unreachable.'], 503);
        }

        $baseUrl = rtrim($streamUrl, '/');
        $candidates = array_values(array_unique(array_filter([
            $baseUrl . (str_contains($baseUrl, '?') ? '&' : '?') . 't=' . time(),
            GateService::resolveCaptureUrl($streamUrl),
            preg_replace('/\/stream\/?$/i', '/jpg', $baseUrl),
        ])));

        foreach ($candidates as $url) {
            try {
                $response = Http::timeout(6)
                    ->withHeaders(['Accept' => 'image/*'])
                    ->get($url . (str_contains($url, '?') ? '&' : '?') . 't=' . time());

                if (! $response->successful()) {
                    continue;
                }

                $contentType = $response->header('Content-Type') ?? 'image/jpeg';
                if (! str_starts_with($contentType, 'image/')) {
                    continue;
                }

                return response($response->body(), 200, [
                    'Content-Type' => $contentType,
                    'Cache-Control' => 'no-store, no-cache, must-revalidate',
                ]);
            } catch (\Throwable) {
                continue;
            }
        }

        return response()->json(['message' => 'Unable to capture frame from camera.'], 502);
    }

    /**
     * Stream proxy: Relay the ESP32-CAM MJPEG stream through the Laravel backend.
     * This avoids the browser's mixed-content restriction (HTTPS page → HTTP camera)
     * and the ESP32-CAM's single-client stream limitation.
     */
    public function cameraStreamProxy(Request $request)
    {
        // 1. Manually authenticate the request using either the Bearer token or query parameter token.
        // This is necessary because HTML <img> tags cannot send custom headers (like Authorization: Bearer ...).
        $tokenString = $request->query('token') ?? $request->bearerToken();
        $authenticated = false;

        if ($tokenString) {
            if (str_starts_with($tokenString, 'Bearer ')) {
                $tokenString = substr($tokenString, 7);
            }
            if (strpos($tokenString, '|') !== false) {
                [$id, $tokenString] = explode('|', $tokenString, 2);
            }
            
            $tokenModel = PersonalAccessToken::findToken($tokenString);
            if ($tokenModel && $tokenModel->tokenable) {
                $authenticated = true;
            }
        } else {
            // Fall back to Sanctum auth guard if a token was set in session/cookie or normal auth context
            if (auth('sanctum')->check()) {
                $authenticated = true;
            }
        }

        if (!$authenticated) {
            return response()->json(['message' => 'Unauthorized stream access.'], 401);
        }

        $validated = $request->validate([
            'location' => ['required', 'in:entrance,exit'],
        ]);

        $filename = $validated['location'] === 'exit' ? 'camera_exit.jpg' : 'camera_entrance.jpg';
        $localPath = public_path($filename);
        $useLocalFile = false;

        if (file_exists($localPath)) {
            clearstatcache(true, $localPath);
            if (time() - filemtime($localPath) < 10) { // If updated in the last 10 seconds
                $useLocalFile = true;
            }
        }

        if ($useLocalFile) {
            return response()->stream(function () use ($localPath) {
                $lastModified = 0;
                while (true) {
                    if (connection_aborted()) {
                        break;
                    }

                    if (file_exists($localPath)) {
                        clearstatcache(true, $localPath);
                        $mtime = filemtime($localPath);
                        if ($mtime > $lastModified) {
                            $lastModified = $mtime;
                            $data = @file_get_contents($localPath);
                            if ($data) {
                                echo "--123456789000000000000987654321\r\n";
                                echo "Content-Type: image/jpeg\r\n";
                                echo "Content-Length: " . strlen($data) . "\r\n\r\n";
                                echo $data . "\r\n";
                                if (ob_get_level()) {
                                    ob_flush();
                                }
                                flush();
                            }
                        }
                    }
                    usleep(100000); // 100ms sleep (10 FPS)
                }
            }, 200, [
                'Content-Type' => 'multipart/x-mixed-replace; boundary=123456789000000000000987654321',
                'Cache-Control' => 'no-store, no-cache, must-revalidate',
                'Pragma' => 'no-cache',
                'Connection' => 'close',
                'X-Accel-Buffering' => 'no',
            ]);
        }

        $system = SystemStatus::current();
        $streamUrl = $validated['location'] === 'exit'
            ? ($system->exit_camera_stream_url ?: env('ESP32_CAM_EXIT_STREAM_URL', 'http://192.168.2.105:81/stream'))
            : ($system->entrance_camera_stream_url ?: $system->camera_stream_url ?: env('ESP32_CAM_ENTRANCE_STREAM_URL', env('ESP32_CAM_STREAM_URL', 'http://192.168.2.100:81/stream')));

        if (! $streamUrl) {
            return response()->json(['message' => 'No camera stream URL configured for this location.'], 404);
        }

        $parts = parse_url($streamUrl);
        $host = $parts['host'] ?? null;
        $port = $parts['port'] ?? 80;
        $online = false;

        if ($host) {
            $connection = @fsockopen($host, $port, $errno, $errstr, 1.0);
            if (is_resource($connection)) {
                fclose($connection);
                $online = true;
            }
        }

        if (!$online) {
            return response()->json(['message' => 'Camera is offline or unreachable.'], 503);
        }

        // Open a raw cURL connection to the ESP32-CAM MJPEG stream (Direct streaming fallback)
        return response()->stream(function () use ($streamUrl) {
            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_URL => $streamUrl,
                CURLOPT_RETURNTRANSFER => false,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_CONNECTTIMEOUT => 5,
                CURLOPT_TIMEOUT => 0, // no timeout — stream indefinitely
                CURLOPT_WRITEFUNCTION => function ($ch, $data) {
                    echo $data;
                    if (ob_get_level()) {
                        ob_flush();
                    }
                    flush();

                    // Stop if the client disconnected
                    if (connection_aborted()) {
                        return 0; // returning 0 tells cURL to abort
                    }

                    return strlen($data);
                },
            ]);

            curl_exec($ch);
            curl_close($ch);
        }, 200, [
            'Content-Type' => 'multipart/x-mixed-replace; boundary=123456789000000000000987654321',
            'Cache-Control' => 'no-store, no-cache, must-revalidate',
            'Pragma' => 'no-cache',
            'Connection' => 'close',
            'X-Accel-Buffering' => 'no',
        ]);
    }

    public function testConnection(Request $request)
    {
        $validated = $request->validate([
            'url' => ['required', 'string', 'max:500'],
        ]);

        $url = $validated['url'];
        $parts = parse_url($url);
        $host = $parts['host'] ?? null;
        $port = $parts['port'] ?? 80;

        if (! $host) {
            return response()->json(['online' => false, 'message' => 'Invalid URL format.'], 200);
        }

        $connection = @fsockopen($host, $port, $errno, $errstr, 1.0);

        if (is_resource($connection)) {
            fclose($connection);
            return response()->json(['online' => true], 200);
        }

        return response()->json(['online' => false, 'message' => 'Connection timed out or refused.'], 200);
    }
}

