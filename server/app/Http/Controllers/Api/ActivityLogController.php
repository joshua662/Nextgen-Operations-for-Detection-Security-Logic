<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function loadActivityLogs(Request $request)
    {
        $search = $request->input('search');
        $eventType = $request->input('event_type');

        $logs = ActivityLog::query()
            ->with(['user'])
            ->when($eventType, fn ($q) => $q->where('event_type', $eventType))
            ->when($search, function ($q) use ($search) {
                $q->where(function ($inner) use ($search) {
                    $inner->where('username_attempted', 'like', "%{$search}%")
                        ->orWhere('event_type', 'like', "%{$search}%")
                        ->orWhere('ip_address', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('created_at')
            ->paginate(25);

        return response()->json(['logs' => $logs], 200);
    }
}
