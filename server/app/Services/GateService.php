<?php

namespace App\Services;

use App\Models\GateLog;
use App\Models\Notification;
use App\Models\SystemStatus;
use App\Models\UpdateRequest;
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

    public static function normalizeRfidUid(?string $rfidCardUid): ?string
    {
        if (! $rfidCardUid) {
            return null;
        }

        return strtoupper(preg_replace('/[^A-F0-9]/', '', $rfidCardUid));
    }

    public static function formatLog(GateLog $log): GateLog
    {
        $log->capture_image = self::captureImageUrl($log->capture_image);

        return $log;
    }

    public static function verifyAccess(?string $plateNumber, ?string $rfidCardUid, ?string $direction, ?UploadedFile $image = null): array
    {
        $resident = null;
        $guestRequest = null;
        $normalizedPlate = null;

        $normalizedRfidCardUid = self::normalizeRfidUid($rfidCardUid);

        if ($normalizedRfidCardUid) {
            // Find resident by normalized RFID Card UID
            $resident = User::with('gender')
                ->where('role', 'resident')
                ->where('is_deleted', false)
                ->whereRaw('UPPER(REPLACE(REPLACE(REPLACE(rfid_card_uid, " ", ""), "-", ""), ":", "")) = ?', [$normalizedRfidCardUid])
                ->first();
        }

        $direction = self::inferDirection($direction, $resident);

        // If no resident is found by RFID, and a plate number is provided, search by plate number
        if (! $resident && $plateNumber) {
            $normalizedPlate = strtoupper(preg_replace('/\s+/', '', $plateNumber));

            ['resident' => $resident, 'guestRequest' => $guestRequest] = self::findByPlate($normalizedPlate);
        }

        $authorized = (bool) ($resident || $guestRequest);
        $status = $authorized ? 'authorized' : 'unauthorized';
        $captureFile = self::storeCapture($image);
        $guestChanges = $guestRequest?->requested_changes ?? [];

        // For RFID scans, if we matched a resident, grab their registered plate.
        // Otherwise, store a placeholder like "RFID:UID" or the actual plate if provided.
        $logPlate = $normalizedPlate;
        if (! $logPlate) {
            if ($resident && $resident->plate_number) {
                $logPlate = strtoupper(preg_replace('/\s+/', '', $resident->plate_number));
            } else {
                $logPlate = $normalizedRfidCardUid ? 'RFID:' . $normalizedRfidCardUid : 'UNKNOWN';
            }
        }

        $log = GateLog::create([
            'user_id' => $resident?->user_id ?? $guestRequest?->user_id,
            'plate_number' => $logPlate,
            'owner_name' => $resident?->owner_name ?? ($guestChanges['guest_name'] ?? null),
            'car_model' => $resident?->car_model ?? ($guestChanges['guest_car_model'] ?? null),
            'car_color' => $resident?->car_color ?? ($guestChanges['guest_car_color'] ?? null),
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

        $displayIdentifier = $normalizedPlate ?: ($rfidCardUid ? 'RFID ' . $rfidCardUid : 'UNKNOWN');

        if ($authorized) {
            self::notifyAdmins(
                'Gate Opened',
                "Authorized {$direction} entry for {$displayIdentifier}.",
                'gate_open'
            );

            if ($resident) {
                self::notifyUser(
                    $resident,
                    'Gate Access',
                    'Gate opened at ' . now()->format('g:i A') . " ({$direction}).",
                    'gate_open'
                );
            } elseif ($guestRequest?->resident) {
                self::notifyUser(
                    $guestRequest->resident,
                    'Guest Gate Access',
                    'Approved guest plate ' . $logPlate . ' passed the gate at ' . now()->format('g:i A') . " ({$direction}).",
                    'gate_open'
                );
            }
        } else {
            self::notifyAdmins(
                'Unauthorized Attempt',
                "Unauthorized {$direction} attempt detected for {$displayIdentifier}.",
                'unauthorized'
            );

            if ($normalizedPlate) {
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
        }

        return [
            'authorized' => $authorized,
            'gate_status' => $system->fresh()->gate_status,
            'direction' => strtoupper($direction),
            'gate_action' => strtoupper($direction) === 'IN' ? 'OPEN_ENTRANCE' : 'OPEN_EXIT',
            'gate_command' => strtoupper($direction) === 'IN' ? 'O' : 'X',
            'resident_username' => $resident?->username,
            'resident_name' => $resident?->owner_name,
            'log' => self::formatLog($log),
        ];
    }

    public static function checkPlateRegistration(string $plateNumber): array
    {
        $normalizedPlate = strtoupper(preg_replace('/\s+/', '', $plateNumber));
        ['resident' => $resident, 'guestRequest' => $guestRequest] = self::findByPlate($normalizedPlate);

        $registered = (bool) ($resident || $guestRequest);
        $guestChanges = $guestRequest?->requested_changes ?? [];
        $displayPlate = $resident?->plate_number
            ? strtoupper(preg_replace('/\s+/', '', $resident->plate_number))
            : $normalizedPlate;

        return [
            'registered' => $registered,
            'plate_number' => $displayPlate,
            'resident_name' => $resident?->owner_name ?? ($guestChanges['guest_name'] ?? null),
            'car_model' => $resident?->car_model ?? ($guestChanges['guest_car_model'] ?? null),
            'car_color' => $resident?->car_color ?? ($guestChanges['guest_car_color'] ?? null),
        ];
    }

    public static function resolveCaptureUrl(?string $streamUrl): ?string
    {
        if (! $streamUrl) {
            return null;
        }

        $trimmed = rtrim(trim($streamUrl), '/');
        if (preg_match('/\/stream$/i', $trimmed)) {
            return preg_replace('/\/stream$/i', '/capture', $trimmed);
        }

        return $trimmed . '/capture';
    }

    /**
     * @return array{resident: ?User, guestRequest: ?UpdateRequest}
     */
    private static function findByPlate(string $normalizedPlate): array
    {
        $resident = User::with('gender')
            ->where('role', 'resident')
            ->where('is_deleted', false)
            ->whereRaw('UPPER(REPLACE(plate_number, " ", "")) = ?', [$normalizedPlate])
            ->first();

        $guestRequest = null;

        if (! $resident) {
            $guestRequest = UpdateRequest::with('resident')
                ->where('status', 'approved')
                ->whereDate('created_at', '<=', now())
                ->get()
                ->first(function (UpdateRequest $request) use ($normalizedPlate) {
                    $changes = $request->requested_changes ?? [];

                    if (($changes['request_type'] ?? null) !== 'guest_access') {
                        return false;
                    }

                    $guestPlate = strtoupper(preg_replace('/\s+/', '', $changes['guest_plate_number'] ?? ''));
                    $accessDate = $changes['access_date'] ?? null;

                    return $guestPlate === $normalizedPlate
                        && $accessDate
                        && date('Y-m-d', strtotime($accessDate)) === now()->toDateString();
                });
        }

        if (! $resident && ! $guestRequest && strlen($normalizedPlate) >= 5) {
            $resident = self::findClosestResidentPlate($normalizedPlate);
        }

        return ['resident' => $resident, 'guestRequest' => $guestRequest];
    }

    private static function findClosestResidentPlate(string $normalizedPlate): ?User
    {
        $candidates = User::query()
            ->where('role', 'resident')
            ->where('is_deleted', false)
            ->whereNotNull('plate_number')
            ->get();

        $bestMatch = null;
        $bestDistance = 3;

        foreach ($candidates as $candidate) {
            $registered = strtoupper(preg_replace('/\s+/', '', $candidate->plate_number ?? ''));
            if ($registered === '' || abs(strlen($registered) - strlen($normalizedPlate)) > 1) {
                continue;
            }

            $distance = levenshtein($normalizedPlate, $registered);
            if ($distance < $bestDistance) {
                $bestDistance = $distance;
                $bestMatch = $candidate;
            }
        }

        return $bestDistance <= 2 ? $bestMatch : null;
    }

    private static function inferDirection(?string $direction, ?User $resident = null): string
    {
        if ($direction) {
            return strtoupper($direction);
        }

        if ($resident) {
            $lastLog = GateLog::where('user_id', $resident->user_id)
                ->orderByDesc('logged_at')
                ->first();

            if ($lastLog) {
                return $lastLog->direction === 'IN' ? 'OUT' : 'IN';
            }
        }

        $system = SystemStatus::current();
        return $system->gate_status === 'open' ? 'OUT' : 'IN';
    }

    public static function verifyPlate(string $plateNumber, string $direction, ?UploadedFile $image = null): array
    {
        return self::verifyAccess($plateNumber, null, $direction, $image);
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
        $admins = User::whereIn('role', ['admin', 'security_guard'])->where('is_deleted', false)->get();

        foreach ($admins as $admin) {
            self::notifyUser($admin, $title, $message, $type);
        }
    }
}
