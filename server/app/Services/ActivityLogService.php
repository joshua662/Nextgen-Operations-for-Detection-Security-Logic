<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;

class ActivityLogService
{
    public static function record(
        string $eventType,
        ?string $usernameAttempted = null,
        ?int $userId = null,
        ?Request $request = null,
        ?array $context = null,
    ): void {
        try {
            ActivityLog::create([
                'user_id' => $userId,
                'username_attempted' => $usernameAttempted !== null && $usernameAttempted !== ''
                    ? mb_substr($usernameAttempted, 0, 255)
                    : null,
                'event_type' => $eventType,
                'ip_address' => $request?->ip(),
                'user_agent' => $request?->userAgent() !== null
                    ? mb_substr($request->userAgent(), 0, 2000)
                    : null,
                'context' => $context,
            ]);
        } catch (\Throwable $e) {
            report($e);
        }
    }

    public static function loginFailureAdminPortal(Request $request, string $username): void
    {
        self::record('admin_portal_login_failure', $username, null, $request, [
            'channel' => 'admin_portal',
        ]);
    }

    public static function loginSuccessAdminPortal(Request $request, User $user): void
    {
        self::record('admin_portal_login_success', $user->username, $user->user_id, $request, [
            'channel' => 'admin_portal',
            'role' => $user->role,
        ]);
    }

    public static function residentPortalFailure(Request $request, ?string $identifier, string $reason): void
    {
        self::record('resident_portal_login_failure', $identifier, null, $request, [
            'channel' => 'resident_portal',
            'reason' => $reason,
        ]);
    }

    public static function residentPortalSuccess(Request $request, User $user): void
    {
        self::record('resident_portal_login_success', $user->username, $user->user_id, $request, [
            'channel' => 'resident_portal',
        ]);
    }

    public static function logout(Request $request, User $user): void
    {
        self::record('logout', $user->username, $user->user_id, $request, [
            'role' => $user->role,
        ]);
    }
}
