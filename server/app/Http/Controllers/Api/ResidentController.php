<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ResidentController extends Controller
{
    public function loadResidents(Request $request)
    {
        $search = $request->input('search');

        $residents = User::with(['gender'])
            ->where('role', 'resident')
            ->where('is_deleted', false)
            ->orderBy('last_name')
            ->orderBy('first_name');

        if ($search) {
            $residents->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('middle_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('plate_number', 'like', "%{$search}%")
                    ->orWhere('contact_number', 'like', "%{$search}%");
            });
        }

        $paginated = $residents->paginate(15);

        return response()->json(['residents' => $paginated], 200);
    }

    public function storeResident(Request $request)
    {
        $validated = $this->validateResident($request);

        $age = date_diff(date_create($validated['birth_date']), date_create('now'))->y;

        User::create([
            'role' => 'resident',
            'first_name' => $validated['first_name'],
            'middle_name' => $validated['middle_name'] ?? null,
            'last_name' => $validated['last_name'],
            'gender_id' => $validated['gender'],
            'birth_date' => $validated['birth_date'],
            'age' => $age,
            'contact_number' => $validated['contact_number'],
            'address' => $validated['address'],
            'plate_number' => strtoupper($validated['plate_number']),
            'car_model' => $validated['car_model'],
            'car_color' => $validated['car_color'],
        ]);

        return response()->json(['message' => 'Resident successfully saved.'], 200);
    }

    public function updateResident(Request $request, User $resident)
    {
        if ($resident->role !== 'resident' || $resident->is_deleted) {
            return response()->json(['message' => 'Resident not found.'], 404);
        }

        $validated = $this->validateResident($request, $resident->user_id);
        $age = date_diff(date_create($validated['birth_date']), date_create('now'))->y;

        $resident->update([
            'first_name' => $validated['first_name'],
            'middle_name' => $validated['middle_name'] ?? null,
            'last_name' => $validated['last_name'],
            'gender_id' => $validated['gender'],
            'birth_date' => $validated['birth_date'],
            'age' => $age,
            'contact_number' => $validated['contact_number'],
            'address' => $validated['address'],
            'plate_number' => strtoupper($validated['plate_number']),
            'car_model' => $validated['car_model'],
            'car_color' => $validated['car_color'],
        ]);

        return response()->json([
            'message' => 'Resident successfully updated.',
            'resident' => $resident->load('gender'),
        ], 200);
    }

    public function destroyResident(User $resident)
    {
        if ($resident->role !== 'resident') {
            return response()->json(['message' => 'Resident not found.'], 404);
        }

        $resident->update(['is_deleted' => true]);

        return response()->json(['message' => 'Resident successfully deleted.'], 200);
    }

    private function validateResident(Request $request, ?int $ignoreUserId = null): array
    {
        return $request->validate([
            'first_name' => ['required', 'max:55'],
            'middle_name' => ['nullable', 'max:55'],
            'last_name' => ['required', 'max:55'],
            'gender' => ['required', 'exists:tbl_genders,gender_id'],
            'birth_date' => ['required', 'date'],
            'contact_number' => ['required', 'max:20'],
            'address' => ['required', 'max:255'],
            'plate_number' => ['required', 'max:20', Rule::unique('tbl_users', 'plate_number')->ignore($ignoreUserId, 'user_id')],
            'car_model' => ['required', 'max:55'],
            'car_color' => ['required', 'max:55'],
        ]);
    }
}
