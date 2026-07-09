<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemStatus;
use App\Services\GateService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class GateController extends Controller
{
    public function status()
    {
        $system = SystemStatus::current();

        return response()->json([
            'gate_status' => $system->gate_status,
            'camera_status' => $system->entrance_camera_status ?? $system->camera_status,
            'entrance_camera_status' => $system->entrance_camera_status ?? $system->camera_status,
            'exit_camera_status' => $system->exit_camera_status ?? 'offline',
            'sensor_status' => $system->sensor_status,
            'camera_stream_url' => $system->entrance_camera_stream_url ?? $system->camera_stream_url,
            'entrance_camera_stream_url' => $system->entrance_camera_stream_url ?? $system->camera_stream_url,
            'exit_camera_stream_url' => $system->exit_camera_stream_url,
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
            'camera_stream_url' => ['nullable', 'url', 'max:500'],
            'entrance_camera_stream_url' => ['nullable', 'url', 'max:500'],
            'exit_camera_stream_url' => ['nullable', 'url', 'max:500'],
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

        $system = SystemStatus::current();
        $streamUrl = $validated['location'] === 'exit'
            ? $system->exit_camera_stream_url
            : ($system->entrance_camera_stream_url ?? $system->camera_stream_url);

        if (! $streamUrl) {
            return response()->json(['message' => 'No camera configured for this location.'], 404);
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
}
