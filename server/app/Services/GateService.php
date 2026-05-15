<?php

namespace App\Services;

use App\Models\GateLog;
use App\Models\Notification;
use App\Models\SystemStatus;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class GateService
{
    public static function captureImageUrl(?string $filename): ?string
    {
        if (! $filename) {
            return null;
        }

        return url('storage/public/img/gate/captures/' . $filename);
    }

    public static function storeCapture(?UploadedFile $file): ?string
    {
        if (! $file) {
            return null;
        }

        $filename = sha1(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME) . '_' . time()) . '.' . $file->getClientOriginalExtension();
        $file->storeAs('public/img/gate/captures', $filename);

        return $filename;
    }

    public static function formatLog(GateLog $log): GateLog
    {
        $log->capture_image = self::captureImageUrl($log->capture_image);

        return $log;
    }

    public static function verifyPlate(string $plateNumber, string $direction, ?UploadedFile $image = null): array
    {
        $normalizedPlate = strtoupper(preg_replace('/\s+/', '', $plateNumber));

        $resident = User::with('gender')
            ->where('role', 'resident')
            ->where('is_deleted', false)
            ->whereRaw('UPPER(REPLACE(plate_number, " ", "")) = ?', [$normalizedPlate])
            ->first();

        $authorized = (bool) $resident;
        $status = $authorized ? 'authorized' : 'unauthorized';
        $captureFile = self::storeCapture($image);

        $log = GateLog::create([
            'user_id' => $resident?->user_id,
            'plate_number' => $normalizedPlate,
            'owner_name' => $resident?->owner_name,
            'car_model' => $resident?->car_model,
            'car_color' => $resident?->car_color,
            'direction' => strtoupper($direction),
            'status' => $status,
            'capture_image' => $captureFile,
            'logged_at' => now(),
        ]);

        $system = SystemStatus::current();
        $system->update([
            'gate_status' => $authorized ? 'open' : 'closed',
            'sensor_status' => 'online',
        ]);

        if ($authorized) {
            self::notifyAdmins(
                'Gate Opened',
                "Authorized {$direction} entry for plate {$normalizedPlate}.",
                'gate_open'
            );

            self::notifyUser(
                $resident,
                'Gate Access',
                'Gate opened at ' . now()->format('g:i A') . " ({$direction}).",
                'gate_open'
            );
        } else {
            self::notifyAdmins(
                'Unauthorized Attempt',
                "Unauthorized {$direction} attempt detected for plate {$normalizedPlate}.",
                'unauthorized'
            );

            $linkedResident = User::where('role', 'resident')
                ->where('is_deleted', false)
                ->whereRaw('UPPER(REPLACE(plate_number, " ", "")) = ?', [$normalizedPlate])
                ->first();

            if ($linkedResident) {
                self::notifyUser(
                    $linkedResident,
                    'Security Alert',
                    "Unauthorized attempt detected with your plate ({$normalizedPlate}).",
                    'unauthorized'
                );
            }
        }

        return [
            'authorized' => $authorized,
            'gate_status' => $system->fresh()->gate_status,
            'log' => self::formatLog($log),
        ];
    }

    public static function notifyUser(User $user, string $title, string $message, string $type): void
    {
        Notification::create([
            'user_id' => $user->user_id,
            'title' => $title,
            'message' => $message,
            'type' => $type,
        ]);
    }

    public static function notifyAdmins(string $title, string $message, string $type): void
    {
        $admins = User::where('role', 'admin')->where('is_deleted', false)->get();

        foreach ($admins as $admin) {
            self::notifyUser($admin, $title, $message, $type);
        }
    }
}
