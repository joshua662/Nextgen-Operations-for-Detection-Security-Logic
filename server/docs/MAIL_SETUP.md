# Email setup (Gmail SMTP)

This project sends registration credentials using **Laravel Mail** over **SMTP** (same idea as PHPMailer: host, port, username, password). You can use **any Gmail account**—only change `server/.env`.

## 1. Create a Gmail App Password

1. Sign in to the Gmail account that will **send** mail (e.g. `yourname@gmail.com`).
2. Turn on **2-Step Verification**: Google Account → Security → 2-Step Verification.
3. Create an **App Password**: Security → App passwords → Mail → Other → name it (e.g. `Nextgen Gate`).
4. Copy the **16-character** password (no spaces). This is `MAIL_PASSWORD`, not your normal Gmail login password.

## 2. Configure `server/.env`

Open `server/.env` and set:

```env
MAIL_MAILER=smtp
MAIL_SCHEME=null
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_gmail@gmail.com
MAIL_PASSWORD=your_16_char_app_password
MAIL_FROM_ADDRESS="your_gmail@gmail.com"
MAIL_FROM_NAME="Nextgen Operations"

# Optional: copy every credentials email to an admin inbox
# MAIL_BCC_ADDRESS=admin@gmail.com
```

| Variable | Purpose |
|----------|---------|
| `MAIL_USERNAME` | Gmail address used to log in to SMTP |
| `MAIL_PASSWORD` | Gmail **App Password** (16 characters) |
| `MAIL_FROM_ADDRESS` | “From” address (should match the sending Gmail) |
| `MAIL_BCC_ADDRESS` | Optional; BCC admin on every credentials email |

**Do not** set `MAIL_SCHEME=tls` (Laravel expects `null` or `smtps`).

## 3. Reload config

From the `server` folder:

```bash
php artisan config:clear
```

Restart the API if it is already running:

```bash
php artisan serve
```

## 4. Test SMTP

**Option A – API**

```http
POST http://localhost:8000/api/auth/smtp-test
Content-Type: application/json

{}
```

Send to another address:

```json
{ "to": "recipient@gmail.com" }
```

**Option B – Register a user**

Register with any email (Gmail, Yahoo, etc.). Credentials are sent to the **email on the registration form**, not a fixed admin address.

## 5. How registration email works

1. User submits registration with their **email** field.
2. Backend creates the account and generates username/password.
3. `MailService` sends `ResidentGateAccessWelcomeMail` to **`user.email`**.
4. Mail is sent **from** the Gmail in `MAIL_USERNAME` via `smtp.gmail.com:587`.

## 6. Troubleshooting

| Problem | Fix |
|---------|-----|
| `UnsupportedSchemeException` for `tls` | Set `MAIL_SCHEME=null` |
| Authentication failed | Use an **App Password**, not your normal password |
| Mail not received | Check Spam; confirm `MAIL_FROM_ADDRESS` matches `MAIL_USERNAME` |
| Still using old settings | Run `php artisan config:clear` and restart `php artisan serve` |

## 7. PHPMailer vs this project

Your standalone **PHPMailer** sample uses the same Gmail settings:

- Host: `smtp.gmail.com`
- Port: `587` (STARTTLS) or `465` (SSL)
- Username: full Gmail address
- Password: App Password

This Laravel app uses those values through `MAIL_*` in `.env` and `config/mail.php`—no separate `mailfunction.php` is required.
