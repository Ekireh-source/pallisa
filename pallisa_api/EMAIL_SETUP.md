# Email Configuration Guide

This guide explains how to configure email sending for the Pallisa API using environment variables.

## Quick Start

1. **Update your `.env` file** with your email provider settings
2. **Test the configuration** using the provided management command
3. **Run the application** with real email sending enabled

## Environment Variables

The following environment variables control email configuration:

```bash
# Email Backend (choose one)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend          # For real SMTP
# EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend     # For development

# SMTP Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@yourdomain.com

# Site Configuration
SITE_NAME=Pallisa
SUPPORT_EMAIL=support@yourdomain.com
FRONTEND_URL=http://localhost:3000
```

## Provider-Specific Setup

### Gmail Configuration

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
3. **Update your `.env` file**:
   ```bash
   EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USE_TLS=True
   EMAIL_HOST_USER=your-gmail@gmail.com
   EMAIL_HOST_PASSWORD=your-16-char-app-password
   DEFAULT_FROM_EMAIL=Your Name <your-gmail@gmail.com>
   ```

### Outlook/Hotmail Configuration

```bash
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@outlook.com
EMAIL_HOST_PASSWORD=your-password
DEFAULT_FROM_EMAIL=Your Name <your-email@outlook.com>
```

### SendGrid Configuration

```bash
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=your-sendgrid-api-key
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
```

### Mailgun Configuration

```bash
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=postmaster@your-domain.mailgun.org
EMAIL_HOST_PASSWORD=your-mailgun-password
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
```

## Testing Email Configuration

Use the built-in management command to test your email setup:

### Test Simple Email
```bash
python manage.py test_email --to recipient@example.com --type simple
```

### Test OTP Verification Email
```bash
python manage.py test_email --to recipient@example.com --type otp
```

### Test Both Email Types
```bash
python manage.py test_email --to recipient@example.com --type both
```

## Development vs Production

### Development Mode
For development, you can use the console backend to see emails in the terminal:
```bash
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

### Production Mode
For production, use SMTP backend with proper credentials:
```bash
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
# ... other SMTP settings
```

## Email Templates

The system includes the following email templates:

- **OTP Verification**: `accounts/templates/emails/otp_verification.html`
- **Password Reset**: `accounts/templates/email/password_reset_email.html`
- **Password Reset Success**: `accounts/templates/email/password_reset_success.html`

## Security Best Practices

1. **Never commit credentials** to version control
2. **Use environment variables** for all sensitive data
3. **Use App Passwords** for Gmail (not your main password)
4. **Rotate credentials** regularly
5. **Monitor email sending** for abuse
6. **Use HTTPS** for all email-related endpoints

## Troubleshooting

### Common Issues

#### Authentication Failed
- **Gmail**: Make sure you're using an App Password, not your regular password
- **2FA**: Ensure 2-factor authentication is enabled for Gmail
- **Credentials**: Double-check username and password in `.env`

#### Connection Timeout
- **Firewall**: Check if port 587 or 465 is blocked
- **TLS/SSL**: Verify EMAIL_USE_TLS setting matches your provider
- **Host**: Confirm the SMTP host address is correct

#### Emails Not Sending
- **Backend**: Ensure EMAIL_BACKEND is set to SMTP backend
- **FROM Email**: Make sure DEFAULT_FROM_EMAIL is properly configured
- **Permissions**: Verify your email account has SMTP access enabled

### Testing Commands

```bash
# Check current configuration
python manage.py test_email --to test@example.com --type simple

# Test with verbose output
python manage.py test_email --to test@example.com --type both

# Check Django settings
python manage.py shell
>>> from django.conf import settings
>>> print(f"Backend: {settings.EMAIL_BACKEND}")
>>> print(f"Host: {settings.EMAIL_HOST}")
>>> print(f"User: {settings.EMAIL_HOST_USER}")
```

## API Usage

Once configured, emails will be sent automatically for:

- **User Registration**: OTP verification email
- **Email Verification**: Resend OTP functionality  
- **Password Reset**: Reset link email
- **Password Reset Success**: Confirmation email

## Environment File Example

Here's a complete `.env` file example:

```bash
# Django Configuration
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,yourdomain.com

# Email Configuration (Gmail example)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=Pallisa <your-email@gmail.com>

# Site Configuration
SITE_NAME=Pallisa
SUPPORT_EMAIL=support@yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Redis (optional)
REDIS_URL=redis://localhost:6379/1
```

## Support

If you encounter issues:

1. Run the test command with your email
2. Check the Django logs for detailed error messages
3. Verify your email provider's SMTP documentation
4. Ensure your email account has SMTP access enabled 