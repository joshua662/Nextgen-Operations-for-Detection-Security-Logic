<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\ResidentGateAccessWelcomeMail;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    private function generateUsername(string $firstName, string $lastName): string
    {
        $base = strtolower(preg_replace('/[^a-z0-9]/', '', $firstName.Str::substr($lastName, 0, 1)));
        $base = Str::substr($base ?: 'user', 0, 6);

        for ($attempt = 0; $attempt < 50; $attempt++) {
            $candidate = Str::substr($base.random_int(100, 9999), 0, 12);
            if (strlen($candidate) >= 6 && ! User::where('username', $candidate)->exists()) {
                return $candidate;
            }
        }

        return Str::substr($base.bin2hex(random_bytes(4)), 0, 12);
    }

    private function generatePassword(): string
    {
        $chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
        $password = '';
        for ($i = 0; $i < 10; $i++) {
            $password .= $chars[random_int(0, strlen($chars) - 1)];
        }

        return $password;
    }

    private function resolveCredentials(array $validated): array
    {
        $username = $validated['username'] ?? $this->generateUsername(
            $validated['first_name'],
            $validated['last_name'],
        );
        $password = $validated['password'] ?? $this->generatePassword();

        return [$username, $password];
    }

    private function sendPortalCredentials(User $user, string $plainPassword): void
    {
        try {
            Mail::to($user->email)->send(new ResidentGateAccessWelcomeMail(
                $user,
                $plainPassword,
                config('gate.portal_url'),
            ));
        } catch (\Throwable $e) {
            report($e);
        }
    }

    private function registrationResponse(User $user, string $plainPassword, string $message): \Illuminate\Http\JsonResponse
    {
        $user->load('gender');

        return response()->json([
            'message' => $message,
            'user' => $user,
            'credentials' => [
                'username' => $user->username,
                'email' => $user->email,
                'password' => $plainPassword,
                'role' => $user->role,
            ],
        ], 201);
    }

    public function login(Request $request)
    {
        $validated = $request->validate([
            'username' => ['required', 'string', 'min:6', 'max:12'],
            'password' => ['required', 'string', 'min:6', 'max:12'],
        ]);

        $user = User::with(['gender'])
            ->where('username', $validated['username'])
            ->where('is_deleted', false)
            ->whereIn('role', ['admin', 'resident'])
            ->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            ActivityLogService::loginFailureAdminPortal($request, $validated['username']);

            return response()->json([
                'message' => 'The provided credentials are incorrect.',
            ], 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        ActivityLogService::loginSuccessAdminPortal($request, $user);

        return response()->json([
            'user' => $user,
            'token' => $token,
        ], 200);
    }

    public function residentLogin(Request $request)
    {
        if ($request->filled('username')) {
            $validated = $request->validate([
                'username' => ['required', 'string', 'min:6', 'max:12'],
                'password' => ['required', 'string', 'min:6', 'max:12'],
            ]);

            $user = User::with(['gender'])
                ->where('role', 'resident')
                ->where('is_deleted', false)
                ->where('username', $validated['username'])
                ->first();

            if (! $user || ! Hash::check($validated['password'], $user->password)) {
                ActivityLogService::residentPortalFailure(
                    $request,
                    $validated['username'],
                    'invalid_username_password',
                );

                return response()->json([
                    'message' => 'The provided credentials are incorrect.',
                ], 401);
            }
        } else {
            $validated = $request->validate([
                'plate_number' => ['required', 'string', 'max:20'],
                'contact_number' => ['required', 'string', 'max:20'],
            ]);

            $normalizedPlate = strtoupper(preg_replace('/\s+/', '', $validated['plate_number']));

            $user = User::with(['gender'])
                ->where('role', 'resident')
                ->where('is_deleted', false)
                ->where('contact_number', $validated['contact_number'])
                ->whereRaw('UPPER(REPLACE(plate_number, " ", "")) = ?', [$normalizedPlate])
                ->first();

            if (! $user) {
                ActivityLogService::residentPortalFailure(
                    $request,
                    $normalizedPlate,
                    'invalid_plate_contact',
                );

                return response()->json([
                    'message' => 'Invalid plate number or contact number.',
                ], 401);
            }
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        ActivityLogService::residentPortalSuccess($request, $user);

        return response()->json([
            'user' => $user,
            'token' => $token,
        ], 200);
    }

    public function adminRegister(Request $request)
    {
        $validated = $request->validate([
            'first_name' => ['required', 'max:55'],
            'middle_name' => ['nullable', 'max:55'],
            'last_name' => ['required', 'max:55'],
            'gender' => ['required', 'exists:tbl_genders,gender_id'],
            'birth_date' => ['required', 'date'],
            'email' => ['required', 'email', 'max:255', Rule::unique('tbl_users', 'email')],
            'username' => ['sometimes', 'min:6', 'max:12', Rule::unique('tbl_users', 'username')],
            'password' => ['sometimes', 'min:6', 'max:12', 'confirmed'],
        ]);

        [$username, $plainPassword] = $this->resolveCredentials($validated);
        $age = date_diff(date_create($validated['birth_date']), date_create('now'))->y;

        $user = User::create([
            'role' => 'admin',
            'first_name' => $validated['first_name'],
            'middle_name' => $validated['middle_name'] ?? null,
            'last_name' => $validated['last_name'],
            'gender_id' => (int) $validated['gender'],
            'birth_date' => $validated['birth_date'],
            'age' => $age,
            'email' => $validated['email'],
            'username' => $username,
            'password' => $plainPassword,
            'is_deleted' => false,
        ]);

        $this->sendPortalCredentials($user, $plainPassword);

        return $this->registrationResponse(
            $user,
            $plainPassword,
            'Registration successful. Login credentials have been sent to your email address.',
        );
    }

    public function residentRegister(Request $request)
    {
        $validated = $request->validate([
            'first_name' => ['required', 'max:55'],
            'middle_name' => ['nullable', 'max:55'],
            'last_name' => ['required', 'max:55'],
            'gender' => ['required', 'exists:tbl_genders,gender_id'],
            'birth_date' => ['required', 'date'],
            'email' => ['required', 'email', 'max:255', Rule::unique('tbl_users', 'email')],
            'username' => ['sometimes', 'min:6', 'max:12', Rule::unique('tbl_users', 'username')],
            'password' => ['sometimes', 'min:6', 'max:12', 'confirmed'],
            'contact_number' => ['nullable', 'max:20'],
            'address' => ['nullable', 'max:255'],
            'plate_number' => ['nullable', 'max:20', Rule::unique('tbl_users', 'plate_number')],
            'car_model' => ['nullable', 'max:55'],
            'car_color' => ['nullable', 'max:55'],
        ]);

        [$username, $plainPassword] = $this->resolveCredentials($validated);
        $age = date_diff(date_create($validated['birth_date']), date_create('now'))->y;

        $user = User::create([
            'role' => 'resident',
            'first_name' => $validated['first_name'],
            'middle_name' => $validated['middle_name'] ?? null,
            'last_name' => $validated['last_name'],
            'gender_id' => (int) $validated['gender'],
            'birth_date' => $validated['birth_date'],
            'age' => $age,
            'email' => $validated['email'],
            'username' => $username,
            'password' => $plainPassword,
            'is_deleted' => false,
            'contact_number' => $validated['contact_number'] ?? null,
            'address' => $validated['address'] ?? null,
            'plate_number' => isset($validated['plate_number'])
                ? strtoupper($validated['plate_number'])
                : null,
            'car_model' => $validated['car_model'] ?? null,
            'car_color' => $validated['car_color'] ?? null,
        ]);

        $this->sendPortalCredentials($user, $plainPassword);

        return $this->registrationResponse(
            $user,
            $plainPassword,
            'Registration successful. Login credentials have been sent to your email address.',
        );
    }

    public function logout(Request $request)
    {
        $user = $request->user();
        ActivityLogService::logout($request, $user);
        $user->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged Out Successfully',
        ], 200);
    }

    public function me(Request $request)
    {
        return response()->json([
            'user' => $request->user()->load(['gender']),
        ], 200);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        if (! $user->isResident()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'first_name' => ['required', 'max:55'],
            'middle_name' => ['nullable', 'max:55'],
            'last_name' => ['required', 'max:55'],
            'gender' => ['required', 'exists:tbl_genders,gender_id'],
            'birth_date' => ['required', 'date'],
            'email' => ['required', 'email', 'max:255', Rule::unique('tbl_users', 'email')->ignore($user->user_id, 'user_id')],
            'username' => ['required', 'min:6', 'max:12', Rule::unique('tbl_users', 'username')->ignore($user->user_id, 'user_id')],
            'contact_number' => ['required', 'max:20'],
            'address' => ['required', 'max:255'],
            'plate_number' => ['required', 'max:20', Rule::unique('tbl_users', 'plate_number')->ignore($user->user_id, 'user_id')],
            'car_model' => ['required', 'max:55'],
            'car_color' => ['required', 'max:55'],
        ]);

        $age = date_diff(date_create($validated['birth_date']), date_create('now'))->y;

        $user->update([
            'first_name' => $validated['first_name'],
            'middle_name' => $validated['middle_name'] ?? null,
            'last_name' => $validated['last_name'],
            'gender_id' => $validated['gender'],
            'birth_date' => $validated['birth_date'],
            'age' => $age,
            'email' => $validated['email'],
            'username' => $validated['username'],
            'contact_number' => $validated['contact_number'],
            'address' => $validated['address'],
            'plate_number' => strtoupper($validated['plate_number']),
            'car_model' => $validated['car_model'],
            'car_color' => $validated['car_color'],
        ]);

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => $user->load('gender'),
        ], 200);
    }
}
