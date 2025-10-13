# Email Setup Guide

## Setting up Real Email Sending

To enable real email sending for course invitations and password resets, you can use one of three methods:

1. **EmailJS (Recommended)** - Easy setup, works from the frontend
2. **SendGrid** - Server-side email service  
3. **Gmail** - Using Gmail SMTP with app passwords

## Method 1: EmailJS Setup (Recommended)

EmailJS is the easiest to set up and doesn't require server-side email configuration.

### Step 1: Create EmailJS Account

1. Go to [EmailJS.com](https://www.emailjs.com/) and create a free account
2. Create a new email service (Gmail, Outlook, etc.)
3. Create an email template
4. Get your Service ID, Template ID, and Public Key

### Step 2: Set up Environment Variables

1. Create a `.env.local` file in your project root
2. Add the following environment variables:

```bash
# EmailJS Configuration
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id  
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key

# App URL (for links in emails)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 3: EmailJS Template Setup

Your EmailJS template should include these variables:
- `{{to_email}}` - Recipient email
- `{{to_name}}` - Recipient name (optional)
- `{{from_name}}` - Sender name (Peercept)
- `{{subject}}` - Email subject
- `{{message}}` - Plain text message
- `{{html_message}}` - HTML content (optional)

### For Production

```bash
# EmailJS Configuration
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key

# App URL (for links in emails)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Method 2: SendGrid Setup (Alternative)

If you prefer server-side email sending:

```bash
# SendGrid Configuration
SENDGRID_API_KEY=your_sendgrid_api_key

# App URL (for links in emails)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Method 3: Gmail Setup Instructions (Alternative)

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

## Migration from SendGrid to EmailJS

If you're currently using SendGrid and want to switch to EmailJS:

1. **Install EmailJS**: Already done with `npm install @emailjs/browser`
2. **Set up EmailJS account** as described in Method 1 above
3. **Update environment variables** to use EmailJS instead of SendGrid
4. **Remove SendGrid variables** from your environment files

The system will automatically detect which email service is configured and use the appropriate method.

## Alternative Email Services

If you prefer not to use any of the above methods, you can modify the `createTransporter` function in `src/lib/email.ts`:

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