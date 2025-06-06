# Email Setup Guide

## Setting up Real Email Sending

To enable real email sending for course invitations and password resets, you need to configure email credentials.

### For Development (Local)

1. Create a `.env.local` file in your project root
2. Add the following environment variables:

```bash
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# App URL (for links in emails)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### For Production (VM/Server)

1. Create a `.env.production` file or set environment variables on your server
2. Add the same variables with your production email credentials:

```bash
# Email Configuration
EMAIL_USER=your-production-email@gmail.com
EMAIL_PASSWORD=your-production-app-password

# App URL (for links in emails)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Gmail Setup Instructions

### Step 1: Enable 2-Factor Authentication
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Navigate to Security
3. Enable 2-Factor Authentication if not already enabled

### Step 2: Generate App Password
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Navigate to Security > 2-Step Verification
3. Scroll down to "App passwords"
4. Generate a new app password for "Mail"
5. Use this 16-character password as your `EMAIL_PASSWORD`

### Step 3: Configure Environment Variables
```bash
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop  # The 16-character app password
```

## Alternative Email Services

If you prefer not to use Gmail, you can modify the `createTransporter` function in `src/lib/email.ts`:

### SendGrid
```javascript
return nodemailer.createTransport({
  service: 'SendGrid',
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY
  }
});
```

### AWS SES
```javascript
return nodemailer.createTransport({
  host: 'email-smtp.us-east-1.amazonaws.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.AWS_SES_ACCESS_KEY,
    pass: process.env.AWS_SES_SECRET_KEY
  }
});
```

### Custom SMTP
```javascript
return nodemailer.createTransport({
  host: 'your-smtp-server.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});
```

## Testing Email Functionality

1. Set up your environment variables
2. Restart your development server: `npm run dev`
3. Try adding a new student to a course with an email that doesn't exist in the system
4. Check the console logs and your email inbox

## Fallback Behavior

- **No credentials set**: Emails are logged to console (development mode)
- **Invalid credentials**: Falls back to console logging in development
- **Production**: Emails will fail silently if credentials are invalid

## Security Notes

- Never commit your `.env` files to version control
- Use app passwords, not your regular Gmail password
- Rotate your email credentials periodically
- Consider using dedicated email services for production 