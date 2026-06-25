<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GateLog;
use App\Models\Notification;
use App\Models\SystemStatus;
use App\Models\UpdateRequest;
use App\Models\User;
use App\Services\GateService;
use Carbon\Carbon;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function overview()
    {
        $today = Carbon::today();

        $authorizedToday = GateLog::where('status', 'authorized')
            ->whereDate('logged_at', $today)
            ->count();

        $unauthorizedToday = GateLog::where('status', 'unauthorized')
            ->whereDate('logged_at', $today)
            ->count();

        $pendingRequests = UpdateRequest::where('status', 'pending')->count();
        $totalResidents = User::where('role', 'resident')->where('is_deleted', false)->count();
        $unreadNotifications = Notification::where('is_read', false)->count();

        $recentLogs = GateLog::orderByDesc('logged_at')
            ->limit(8)
            ->get()
            ->map(fn ($log) => GateService::formatLog($log));

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
            'stats' => [
                'authorized_entries' => $authorizedToday,
                'unauthorized_attempts' => $unauthorizedToday,
                'total_residents' => $totalResidents,
                'pending_update_requests' => $pendingRequests,
                'unread_notifications' => $unreadNotifications,
            ],
            'recent_logs' => $recentLogs,
        ]);
    }

    public function trafficChart(Request $request)
    {
        $period = $request->input('period', 'daily');

        $start = match ($period) {
            'weekly' => Carbon::now()->subWeeks(8)->startOfWeek(),
            'monthly' => Carbon::now()->subMonths(6)->startOfMonth(),
            default => Carbon::now()->subDays(13)->startOfDay(),
        };

        $logs = GateLog::where('logged_at', '>=', $start)->get();

        $labels = [];
        $authorized = [];
        $unauthorized = [];

        if ($period === 'weekly') {
            for ($i = 0; $i < 8; $i++) {
                $weekStart = Carbon::now()->subWeeks(7 - $i)->startOfWeek();
                $weekEnd = $weekStart->copy()->endOfWeek();
                $labels[] = $weekStart->format('M d');
                $authorized[] = $logs->whereBetween('logged_at', [$weekStart, $weekEnd])->where('status', 'authorized')->count();
                $unauthorized[] = $logs->whereBetween('logged_at', [$weekStart, $weekEnd])->where('status', 'unauthorized')->count();
            }
        } elseif ($period === 'monthly') {
            for ($i = 0; $i < 6; $i++) {
                $monthStart = Carbon::now()->subMonths(5 - $i)->startOfMonth();
                $monthEnd = $monthStart->copy()->endOfMonth();
                $labels[] = $monthStart->format('M Y');
                $authorized[] = $logs->whereBetween('logged_at', [$monthStart, $monthEnd])->where('status', 'authorized')->count();
                $unauthorized[] = $logs->whereBetween('logged_at', [$monthStart, $monthEnd])->where('status', 'unauthorized')->count();
            }
        } else {
            for ($i = 0; $i < 14; $i++) {
                $day = Carbon::now()->subDays(13 - $i)->startOfDay();
                $labels[] = $day->format('M d');
                $authorized[] = $logs->where('logged_at', '>=', $day)->where('logged_at', '<', $day->copy()->addDay())->where('status', 'authorized')->count();
                $unauthorized[] = $logs->where('logged_at', '>=', $day)->where('logged_at', '<', $day->copy()->addDay())->where('status', 'unauthorized')->count();
            }
        }

        return response()->json([
            'period' => $period,
            'labels' => $labels,
            'authorized' => $authorized,
            'unauthorized' => $unauthorized,
        ]);
    }
}
