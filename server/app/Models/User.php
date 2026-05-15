<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    protected $table = 'tbl_users';
    protected $primaryKey = 'user_id';
     /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'role',
        'profile_picture',
        'first_name',
        'middle_name',
        'last_name',
        'suffix_name',
        'gender_id',
        'birth_date',
        'age',
        'username',
        'password',
        'contact_number',
        'address',
        'plate_number',
        'car_model',
        'car_color',
        'is_deleted',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }

    public function gender(): BelongsTo
    {
        return $this->belongsTo(Gender::class, 'gender_id', 'gender_id');
    }

    public function gateLogs(): HasMany
    {
        return $this->hasMany(GateLog::class, 'user_id', 'user_id');
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class, 'user_id', 'user_id');
    }

    public function updateRequests(): HasMany
    {
        return $this->hasMany(UpdateRequest::class, 'user_id', 'user_id');
    }

    public function getOwnerNameAttribute(): string
    {
        $name = trim("{$this->first_name} {$this->middle_name} {$this->last_name}");

        return $name ?: 'Unknown';
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin' || $this->role === null;
    }

    public function isResident(): bool
    {
        return $this->role === 'resident';
    }
}
