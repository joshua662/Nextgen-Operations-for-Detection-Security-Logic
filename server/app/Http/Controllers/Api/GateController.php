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
            'camera_status' => $system->camera_status,
            'sensor_status' => $system->sensor_status,
            'camera_stream_url' => $system->camera_stream_url,
        ]);
    }

    public function verify(Request $request)
    {
        $validated = $request->validate([
            'plate_number' => ['required', 'string', 'max:20'],
            'direction' => ['required', 'in:IN,OUT,in,out'],
            'capture_image' => ['nullable', 'image', 'mimes:png,jpg,jpeg'],
        ]);

        $result = GateService::verifyPlate(
            $validated['plate_number'],
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
            'sensor_status' => ['nullable', 'in:online,offline'],
            'camera_stream_url' => ['nullable', 'url', 'max:500'],
        ]);

        $system = SystemStatus::current();
        $system->update(array_filter($validated));

        return response()->json(['system' => $system], 200);
    }
}
