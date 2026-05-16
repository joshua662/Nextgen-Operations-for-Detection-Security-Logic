<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\ResidentGateAccessWelcomeMail;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $validated = $request->validate([
            'username' => ['required', 'string', 'min:6', 'max:12'],
            'password' => ['required', 'string', 'min:6', 'max:12'],
        ]);

        $user = User::with(['gender'])
            ->where('username', $validated['username'])
            ->where('is_deleted', false)
            ->where('role', 'admin')
            ->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'The provided credentials are incorrect.',
            ], 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

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
                return response()->json([
                    'message' => 'Invalid plate number or contact number.',
                ], 401);
            }
        }

        $token = $user->createToken('auth_token')->plainTextToken;

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
            'email' => ['nullable', 'email', 'max:255', Rule::unique('tbl_users', 'email')],
            'username' => ['required', 'min:6', 'max:12', Rule::unique('tbl_users', 'username')],
            'password' => ['required', 'min:6', 'max:12', 'confirmed'],
        ]);

        $age = date_diff(date_create($validated['birth_date']), date_create('now'))->y;

        $user = User::create([
            'role' => 'admin',
            'first_name' => $validated['first_name'],
            'middle_name' => $validated['middle_name'] ?? null,
            'last_name' => $validated['last_name'],
            'gender_id' => $validated['gender'],
            'birth_date' => $validated['birth_date'],
            'age' => $age,
            'email' => $validated['email'] ?? null,
            'username' => $validated['username'],
            'password' => $validated['password'],
        ]);

        $token = $user->load('gender')->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Admin registration successful.',
            'user' => $user,
            'token' => $token,
        ], 201);
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
            'username' => ['required', 'min:6', 'max:12', Rule::unique('tbl_users', 'username')],
            'password' => ['required', 'min:6', 'max:12', 'confirmed'],
            'contact_number' => ['required', 'max:20'],
            'address' => ['required', 'max:255'],
            'plate_number' => ['required', 'max:20', Rule::unique('tbl_users', 'plate_number')],
            'car_model' => ['required', 'max:55'],
            'car_color' => ['required', 'max:55'],
        ]);

        $age = date_diff(date_create($validated['birth_date']), date_create('now'))->y;
        $plainPassword = $validated['password'];

        $user = User::create([
            'role' => 'resident',
            'first_name' => $validated['first_name'],
            'middle_name' => $validated['middle_name'] ?? null,
            'last_name' => $validated['last_name'],
            'gender_id' => $validated['gender'],
            'birth_date' => $validated['birth_date'],
            'age' => $age,
            'email' => $validated['email'],
            'username' => $validated['username'],
            'password' => $plainPassword,
            'contact_number' => $validated['contact_number'],
            'address' => $validated['address'],
            'plate_number' => strtoupper($validated['plate_number']),
            'car_model' => $validated['car_model'],
            'car_color' => $validated['car_color'],
        ]);

        $user->load('gender');

        try {
            Mail::to($user->email)->send(new ResidentGateAccessWelcomeMail(
                $user,
                $plainPassword,
                config('gate.portal_url'),
            ));
        } catch (\Throwable $e) {
            report($e);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Registration successful. Check your email for portal credentials (if mail is configured).',
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

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
