<?php

namespace Database\Seeders;

use App\Models\ActivityLog;
use App\Models\GateLog;
use App\Models\SystemStatus;
use App\Models\User;
use App\Models\Gender;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

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
                'username' => 'msantos1',
                'email' => 'maria.santos@paramount116.test',
                'password' => 'resident',
            ],
            [
                'first_name' => 'Juan',
                'last_name' => 'Reyes',
                'plate_number' => 'XYZ5678',
                'contact_number' => '09179876543',
                'car_model' => 'Honda Civic',
                'car_color' => 'Black',
                'address' => 'Block 3 Lot 12, Green Valley Subdivision',
                'username' => 'jreyes01',
                'email' => 'juan.reyes@paramount116.test',
                'password' => 'resident',
            ],
        ];

        foreach ($residents as $data) {
            $resident = User::updateOrCreate(
                ['plate_number' => strtoupper($data['plate_number'])],
                [
                    'role' => 'resident',
                    'first_name' => $data['first_name'],
                    'last_name' => $data['last_name'],
                    'gender_id' => $genderId,
                    'birth_date' => '1985-06-15',
                    'age' => 40,
                    'username' => $data['username'],
                    'email' => $data['email'],
                    'password' => Hash::make($data['password']),
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

        if ($admin) {
            ActivityLog::firstOrCreate(
                [
                    'user_id' => $admin->user_id,
                    'event_type' => 'admin_portal_login_success',
                    'username_attempted' => $admin->username,
                ],
                [
                    'ip_address' => '127.0.0.1',
                    'user_agent' => 'Seeder',
                    'context' => ['channel' => 'admin_portal', 'role' => 'admin', 'seed' => true],
                ]
            );

            ActivityLog::firstOrCreate(
                [
                    'user_id' => null,
                    'event_type' => 'admin_portal_login_failure',
                    'username_attempted' => "admin' OR '1'='1",
                ],
                [
                    'ip_address' => '127.0.0.1',
                    'user_agent' => 'Demo SQLi attempt (safe — stored as literal text only)',
                    'context' => ['channel' => 'admin_portal', 'seed' => true],
                ]
            );
        }
    }
}
