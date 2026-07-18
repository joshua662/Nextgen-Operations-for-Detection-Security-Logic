<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Password Reset</title>
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
                            We received a request to reset the password for your Gate Access System account.
                        </p>

                        <p style="margin:0 0 24px;">
                            For your security, a new password has been automatically generated for you. Please use the credentials below to log back into your portal.
                        </p>

                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f5;border:1px solid #e4e4e7;border-radius:6px;margin-bottom:24px;">
                            <tr>
                                <td style="padding:20px 24px;">
                                    <p style="margin:0 0 12px;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#52525b;">Your new portal login credentials</p>
                                    <p style="margin:0 0 8px;font-size:15px;font-family:ui-monospace,Menlo,Consolas,monospace;">
                                        <strong>Username:</strong> {{ $username }}
                                    </p>
                                    <p style="margin:0;font-size:15px;font-family:ui-monospace,Menlo,Consolas,monospace;">
                                        <strong>New Password:</strong> {{ $password }}
                                    </p>
                                </td>
                            </tr>
                        </table>

                        <p style="margin:0 0 12px;font-size:14px;">
                            <strong>Gate Access Portal:</strong><br>
                            <a href="{{ $portalUrl }}" style="color:#1e40af;word-break:break-all;">{{ $portalUrl }}</a>
                        </p>

                        <hr style="border:0;border-top:1px solid #e4e4e7;margin:24px 0;">

                        <p style="margin:0;font-size:14px;color:#52525b;">
                            If you did not request this password reset, please contact the security office immediately at
                            <a href="mailto:{{ $securityEmail }}" style="color:#1e40af;">{{ $securityEmail }}</a>.
                        </p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</body>
</html>
