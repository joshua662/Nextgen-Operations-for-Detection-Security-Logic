<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Gate Logs Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 24px; color: #111; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        p.meta { color: #555; font-size: 12px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f3f4f6; }
        .badge-auth { color: #166534; }
        .badge-unauth { color: #991b1b; }
    </style>
</head>
<body>
    <h1>Gate Access Logs Report</h1>
    <p class="meta">Generated: {{ $generatedAt->format('F j, Y g:i A') }} &mdash; {{ $logs->count() }} records</p>
    <table>
        <thead>
            <tr>
                <th>Plate</th>
                <th>Owner</th>
                <th>Car Model</th>
                <th>Color</th>
                <th>Direction</th>
                <th>Status</th>
                <th>Timestamp</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($logs as $log)
            <tr>
                <td>{{ $log->plate_number }}</td>
                <td>{{ $log->owner_name ?? '—' }}</td>
                <td>{{ $log->car_model ?? '—' }}</td>
                <td>{{ $log->car_color ?? '—' }}</td>
                <td>{{ $log->direction }}</td>
                <td class="{{ $log->status === 'authorized' ? 'badge-auth' : 'badge-unauth' }}">{{ ucfirst($log->status) }}</td>
                <td>{{ $log->logged_at }}</td>
            </tr>
            @empty
            <tr><td colspan="7">No logs found.</td></tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
