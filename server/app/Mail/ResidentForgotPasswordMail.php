<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ResidentForgotPasswordMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public string $plainPassword,
        public string $portalUrl,
    ) {}

    public function envelope(): Envelope
    {
        $name = config('gate.security_office.subdivision_name', 'Subdivision');

        return new Envelope(
            subject: 'Your Password Has Been Reset ('.$name.')',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.resident-forgot-password',
            text: 'emails.resident-forgot-password-text',
            with: [
                'fullName' => $this->user->owner_name,
                'username' => $this->user->username,
                'password' => $this->plainPassword,
                'portalUrl' => $this->portalUrl,
                'subdivisionName' => config('gate.security_office.subdivision_name'),
                'securityEmail' => config('gate.security_office.email'),
            ],
        );
    }
}
