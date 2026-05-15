<?php

namespace Database\Seeders;

use App\Models\GateLog;
use App\Models\SystemStatus;
use App\Models\User;
use App\Models\Gender;
use Illuminate\Database\Seeder;

class GateAccessSeeder extends Seeder
{
    public function run(): void
    {
        SystemStatus::firstOrCreate([], [
            'gate_status' => 'closed',
            'camera_status' => 'online',
            'sensor_status' => 'online',
            'camera_stream_url' => env('ESP32_CAM_STREAM_URL', 'http://192.168.1.100/stream'),
        ]);

        $genderId = Gender::query()->value('gender_id');

        if (! $genderId) {
            return;
        }

        User::whereNull('role')->orWhere('role', '')->update(['role' => 'admin']);

        $admin = User::where('username', 'johndoe')->first();
        if ($admin) {
            $admin->update(['role' => 'admin']);
        }

        $residents = [
            [
                'first_name' => 'Maria',
                'last_name' => 'Santos',
                'plate_number' => 'ABC1234',
                'contact_number' => '09171234567',
                'car_model' => 'Toyota Vios',
                'car_color' => 'White',
                'address' => 'Block 1 Lot 5, Green Valley Subdivision',
            ],
            [
                'first_name' => 'Juan',
                'last_name' => 'Reyes',
                'plate_number' => 'XYZ5678',
                'contact_number' => '09179876543',
                'car_model' => 'Honda Civic',
                'car_color' => 'Black',
                'address' => 'Block 3 Lot 12, Green Valley Subdivision',
            ],
        ];

        foreach ($residents as $data) {
            $resident = User::firstOrCreate(
                ['plate_number' => $data['plate_number']],
                [
                    'role' => 'resident',
                    'first_name' => $data['first_name'],
                    'last_name' => $data['last_name'],
                    'gender_id' => $genderId,
                    'birth_date' => '1985-06-15',
                    'age' => 40,
                    'contact_number' => $data['contact_number'],
                    'address' => $data['address'],
                    'car_model' => $data['car_model'],
                    'car_color' => $data['car_color'],
                ]
            );

            GateLog::firstOrCreate(
                [
                    'plate_number' => $resident->plate_number,
                    'logged_at' => now()->subHours(2),
                ],
                [
                    'user_id' => $resident->user_id,
                    'owner_name' => $resident->owner_name,
                    'car_model' => $resident->car_model,
                    'car_color' => $resident->car_color,
                    'direction' => 'IN',
                    'status' => 'authorized',
                ]
            );
        }

        GateLog::firstOrCreate(
            ['plate_number' => 'UNKNOWN99', 'logged_at' => now()->subHour()],
            [
                'owner_name' => null,
                'car_model' => null,
                'car_color' => null,
                'direction' => 'IN',
                'status' => 'unauthorized',
            ]
        );
    }
}
