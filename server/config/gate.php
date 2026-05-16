<?php

return [
    'portal_url' => env('GATE_PORTAL_URL', env('FRONTEND_URL', 'http://localhost:5173').'/login'),

    'security_office' => [
        'phone' => env('SECURITY_OFFICE_PHONE', '(02) 8123-4567'),
        'email' => env('SECURITY_OFFICE_EMAIL', 'security@paramount116.gov.ph'),
        'hours' => env('SECURITY_OFFICE_HOURS', '24 hours, seven days a week'),
        'subdivision_name' => env('SUBDIVISION_NAME', 'Paramount 116 Subdivision'),
    ],
];
