<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UpdateRequest extends Model
{
    protected $table = 'tbl_update_requests';

    protected $primaryKey = 'update_request_id';

    protected $fillable = [
        'user_id',
        'requested_changes',
        'status',
        'admin_notes',
    ];

    protected function casts(): array
    {
        return [
            'requested_changes' => 'array',
        ];
    }

    public function resident(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }
}
