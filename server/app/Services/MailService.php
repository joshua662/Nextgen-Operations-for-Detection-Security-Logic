<?php

namespace App\Services;

use App\Mail\ResidentGateAccessWelcomeMail;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

class MailService
{
    /**
     * Send portal credentials to the account email the user registered with.
     * SMTP sender is configured in .env (any Gmail account with an App Password).
     */
    public static function sendPortalCredentials(User $user, string $plainPassword): ?string
    {
        if (! $user->email) {
            return 'User has no email address.';
        }

        try {
            $mail = Mail::to($user->email);

            $bcc = env('MAIL_BCC_ADDRESS');
            if ($bcc) {
                $mail->bcc($bcc);
            }

            $mail->send(new ResidentGateAccessWelcomeMail(
                $user,
                $plainPassword,
                config('gate.portal_url'),
            ));

            return null;
        } catch (\Throwable $e) {
            report($e);

            return $e->getMessage();
        }
    }

    /**
     * Send a simple SMTP test message (defaults to MAIL_USERNAME).
     */
    public static function sendSmtpTest(?string $to = null): array
    {
        $recipient = $to ?: env('MAIL_USERNAME');

        if (! $recipient) {
            return [
                'ok' => false,
                'recipient' => null,
                'error' => 'Set MAIL_USERNAME in .env to your Gmail address.',
            ];
        }

        try {
            Mail::raw(
                'SMTP test successful. Your Nextgen Operations backend can send email using the Gmail account in MAIL_USERNAME.',
                function ($message) use ($recipient): void {
                    $message
                        ->to($recipient)
                        ->subject('SMTP Test - Nextgen Operations');
                }
            );

            return ['ok' => true, 'recipient' => $recipient, 'error' => null];
        } catch (\Throwable $e) {
            report($e);

            return ['ok' => false, 'recipient' => $recipient, 'error' => $e->getMessage()];
        }
    }
}
