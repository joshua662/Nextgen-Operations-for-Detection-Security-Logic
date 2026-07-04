<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Gate Access Registration</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Georgia,'Times New Roman',serif;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f5;padding:32px 16px;">
    <tr>
        <td align="center">
            <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:#ffffff;border:1px solid #e4e4e7;border-radius:8px;overflow:hidden;">
                <tr>
                    <td style="padding:32px 40px 24px;background-color:#1e3a5f;color:#ffffff;">
                        <h1 style="margin:0;font-size:20px;font-weight:normal;letter-spacing:0.02em;">Gate Access System</h1>
                        <p style="margin:8px 0 0;font-size:13px;opacity:0.9;">{{ $subdivisionName }} — Security Office</p>
                    </td>
                </tr>
                <tr>
                    <td style="padding:32px 40px 24px;color:#18181b;line-height:1.65;font-size:15px;">
                        <p style="margin:0 0 16px;">Dear <strong>{{ $fullName }}</strong>,</p>

                        <p style="margin:0 0 16px;">
                            On behalf of the subdivision security office, we are pleased to inform you that your enrollment in the
                            <strong>Gate Access System</strong> is now complete. You may use the {{ $portalLabel }} at your convenience
                            to review gate activity, receive gate-related notifications, and stay informed about your account.
                        </p>

                        <p style="margin:0 0 24px;">
                            Please treat the credentials below as confidential. We recommend signing in promptly and changing your password
                            through the portal if that option is made available by your administrator.
                        </p>

                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f5;border:1px solid #e4e4e7;border-radius:6px;margin-bottom:24px;">
                            <tr>
                                <td style="padding:20px 24px;">
                                    <p style="margin:0 0 12px;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#52525b;">Your portal login credentials</p>
                                    <p style="margin:0 0 8px;font-size:15px;font-family:ui-monospace,Menlo,Consolas,monospace;">
                                        <strong>Username:</strong> {{ $username }}
                                    </p>
                                    <p style="margin:0;font-size:15px;font-family:ui-monospace,Menlo,Consolas,monospace;">
                                        <strong>Password:</strong> {{ $password }}
                                    </p>
                                </td>
                            </tr>
                        </table>

                        <p style="margin:0 0 12px;font-size:14px;">
                            <strong>Gate Access Portal:</strong><br>
                            <a href="{{ $portalUrl }}" style="color:#1e40af;word-break:break-all;">{{ $portalUrl }}</a>
                        </p>

                        <p style="margin:24px 0 0;padding-top:24px;border-top:1px solid #e4e4e7;font-size:14px;color:#3f3f46;">
                            Thank you for your cooperation. Should you require assistance with portal access or have questions regarding
                            gate procedures, please contact the subdivision security office using the information below.
                        </p>

                        <p style="margin:20px 0 0;font-size:14px;color:#3f3f46;">
                            <strong>Subdivision Security Office</strong><br>
                            Telephone: {{ $phone }}<br>
                            Email: <a href="mailto:{{ $securityEmail }}" style="color:#1e40af;">{{ $securityEmail }}</a><br>
                            Office hours: {{ $hours }}
                        </p>

                        <p style="margin:28px 0 0;font-size:13px;color:#71717a;">
                            This message was sent automatically. Please do not reply directly to this email if it was sent from a no-reply address.
                        </p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</body>
</html>
