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

        $authorizedEntriesToday = GateLog::where('status', 'authorized')
            ->where('direction', 'IN')
            ->whereDate('logged_at', $today)
            ->count();

        $authorizedExitsToday = GateLog::where('status', 'authorized')
            ->where('direction', 'OUT')
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
        $system->checkHealth();
        $system->refresh();

        $entranceUrl = $system->entrance_camera_stream_url ?: $system->camera_stream_url ?: env('ESP32_CAM_ENTRANCE_STREAM_URL', env('ESP32_CAM_STREAM_URL', 'http://192.168.2.100:81/stream'));
        $exitUrl = $system->exit_camera_stream_url ?: env('ESP32_CAM_EXIT_STREAM_URL', 'http://192.168.2.105:81/stream');

        // Car monitor calculations
        $periods = [
            'daily' => [Carbon::today(), Carbon::yesterday()],
            'weekly' => [Carbon::now()->startOfWeek(), Carbon::now()->subWeek()->startOfWeek()],
            'monthly' => [Carbon::now()->startOfMonth(), Carbon::now()->subMonth()->startOfMonth()],
            'yearly' => [Carbon::now()->startOfYear(), Carbon::now()->subYear()->startOfYear()],
        ];

        $car_monitor = [];
        foreach ($periods as $key => [$currentStart, $prevStart]) {
            $currentEntries = GateLog::where('direction', 'IN')->where('logged_at', '>=', $currentStart)->count();
            $currentExits = GateLog::where('direction', 'OUT')->where('logged_at', '>=', $currentStart)->count();
            $currentTotal = $currentEntries + $currentExits;

            $prevEntries = GateLog::where('direction', 'IN')->whereBetween('logged_at', [$prevStart, $currentStart])->count();
            $prevExits = GateLog::where('direction', 'OUT')->whereBetween('logged_at', [$prevStart, $currentStart])->count();
            $prevTotal = $prevEntries + $prevExits;

            $car_monitor[$key] = [
                'count' => $currentTotal,
                'entries' => $currentEntries,
                'exits' => $currentExits,
                'trend' => $currentTotal >= $prevTotal ? 'up' : 'down',
                'diff' => abs($currentTotal - $prevTotal),
            ];
        }

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
            'stats' => [
                'authorized_entries' => $authorizedEntriesToday,
                'authorized_exits' => $authorizedExitsToday,
                'unauthorized_attempts' => $unauthorizedToday,
                'total_residents' => $totalResidents,
                'pending_update_requests' => $pendingRequests,
                'unread_notifications' => $unreadNotifications,
            ],
            'car_monitor' => $car_monitor,
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
