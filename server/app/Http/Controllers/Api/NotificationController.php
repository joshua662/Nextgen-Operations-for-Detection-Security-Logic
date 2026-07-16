<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $notifications = Notification::where('user_id', $request->user()->user_id)
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json(['notifications' => $notifications], 200);
    }

    public function markRead(Request $request, Notification $notification)
    {
        if ($notification->user_id !== $request->user()->user_id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $notification->update(['is_read' => true]);

        return response()->json(['message' => 'Notification marked as read.'], 200);
    }

    public function markAllRead(Request $request)
    {
        Notification::where('user_id', $request->user()->user_id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json(['message' => 'All notifications marked as read.'], 200);
    }

    public function approve(Request $request, Notification $notification)
    {
        if ($notification->user_id !== $request->user()->user_id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        if ($notification->type !== 'registration_approval') {
            return response()->json(['message' => 'Invalid notification type.'], 400);
        }

        $data = json_decode($notification->message, true);
        if (!$data || !isset($data['target_user_id'])) {
            return response()->json(['message' => 'Invalid notification payload.'], 400);
        }

        $user = \App\Models\User::find($data['target_user_id']);
        if (!$user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        $user->update(['is_approved' => true]);

        $plainPassword = $data['plain_password'];
        $email = trim((string) $user->email);
        
        $mailError = null;
        try {
            \Illuminate\Support\Facades\Mail::to($email)->send(
                new \App\Mail\ResidentGateAccessWelcomeMail(
                    $user,
                    $plainPassword,
                    config('gate.portal_url')
                )
            );
        } catch (\Throwable $e) {
            report($e);
            $mailError = $e->getMessage();
        }

        $notification->delete();

        Notification::where('type', 'registration_approval')
            ->where('message', 'like', '%"target_user_id":' . $user->user_id . '%')
            ->delete();

        return response()->json([
            'message' => $mailError 
                ? 'Account approved, but credentials email failed: ' . $mailError
                : 'Account approved. Login credentials have been sent to the registered email address.',
            'mail_sent' => $mailError === null,
        ], 200);
    }

    public function reject(Request $request, Notification $notification)
    {
        if ($notification->user_id !== $request->user()->user_id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        if ($notification->type !== 'registration_approval') {
            return response()->json(['message' => 'Invalid notification type.'], 400);
        }

        $data = json_decode($notification->message, true);
        if (!$data || !isset($data['target_user_id'])) {
            return response()->json(['message' => 'Invalid notification payload.'], 400);
        }

        $user = \App\Models\User::find($data['target_user_id']);
        if ($user) {
            $user->delete();
        }

        $notification->delete();

        Notification::where('type', 'registration_approval')
            ->where('message', 'like', '%"target_user_id":' . $data['target_user_id'] . '%')
            ->delete();

        return response()->json([
            'message' => 'Registration request rejected and account removed.',
        ], 200);
    }
}
