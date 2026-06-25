<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemStatus;
use App\Services\GateService;
use Illuminate\Http\Request;

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
            'direction' => ['required', 'in:IN,OUT,in,out'],
            'capture_image' => ['nullable', 'image', 'mimes:png,jpg,jpeg'],
        ]);

        $result = GateService::verifyAccess(
            $validated['plate_number'] ?? null,
            $validated['rfid_card_uid'] ?? null,
            $validated['direction'],
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
}
