<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GateLog;
use App\Services\GateService;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class GateLogController extends Controller
{
    public function loadGateLogs(Request $request)
    {
        $logs = GateLog::query()
            ->when($request->direction, fn ($q) => $q->where('direction', strtoupper($request->direction)))
            ->when($request->status, fn ($q) => $q->where('status', strtolower($request->status)))
            ->when($request->search, function ($q) use ($request) {
                $search = $request->search;
                $q->where(function ($inner) use ($search) {
                    $inner->where('plate_number', 'like', "%{$search}%")
                        ->orWhere('owner_name', 'like', "%{$search}%");
                });
            })
            ->when($request->user(), function ($q) use ($request) {
                if ($request->user()->isResident()) {
                    $q->where('user_id', $request->user()->user_id);
                }
            })
            ->orderByDesc('logged_at')
            ->paginate(20);

        $logs->getCollection()->transform(fn ($log) => GateService::formatLog($log));

        return response()->json(['logs' => $logs], 200);
    }

    public function exportCsv(Request $request): StreamedResponse
    {
        $filename = 'gate_logs_' . now()->format('Y-m-d_His') . '.csv';

        $query = GateLog::query()
            ->when($request->direction, fn ($q) => $q->where('direction', strtoupper($request->direction)))
            ->when($request->status, fn ($q) => $q->where('status', strtolower($request->status)))
            ->orderByDesc('logged_at');

        return response()->streamDownload(function () use ($query) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Plate Number', 'Owner Name', 'Car Model', 'Car Color', 'Direction', 'Status', 'Timestamp']);

            $query->chunk(200, function ($logs) use ($handle) {
                foreach ($logs as $log) {
                    fputcsv($handle, [
                        $log->plate_number,
                        $log->owner_name,
                        $log->car_model,
                        $log->car_color,
                        $log->direction,
                        $log->status,
                        $log->logged_at,
                    ]);
                }
            });

            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv']);
    }

    public function exportPdf(Request $request)
    {
        $logs = GateLog::query()
            ->when($request->direction, fn ($q) => $q->where('direction', strtoupper($request->direction)))
            ->when($request->status, fn ($q) => $q->where('status', strtolower($request->status)))
            ->orderByDesc('logged_at')
            ->limit(500)
            ->get();

        $html = view('exports.gate_logs_pdf', ['logs' => $logs, 'generatedAt' => now()])->render();

        return response($html, 200, [
            'Content-Type' => 'text/html',
            'Content-Disposition' => 'inline; filename="gate_logs_report.html"',
        ]);
    }
}
