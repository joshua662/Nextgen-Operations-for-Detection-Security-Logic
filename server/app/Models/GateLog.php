<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GateLog extends Model
{
    protected $table = 'tbl_gate_logs';

    protected $primaryKey = 'gate_log_id';

    protected $fillable = [
        'user_id',
        'plate_number',
        'owner_name',
        'car_model',
        'car_color',
        'direction',
        'status',
        'capture_image',
        'logged_at',
    ];

    protected function casts(): array
    {
        return [
            'logged_at' => 'datetime',
        ];
    }

    public function resident(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }
}
