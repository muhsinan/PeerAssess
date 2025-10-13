# EmailJS Templates for Peercept

This folder contains HTML templates for use with EmailJS. These templates are designed to work with the Peercept email system.

## Templates Included

### 1. `general-template.html`
**Use Case**: Universal template for any email type
**Variables Required**:
- `{{to_email}}` - Recipient email address
- `{{to_name}}` - Recipient name (optional)
- `{{from_name}}` - Sender name (usually "Peercept")
- `{{subject}}` - Email subject line
- `{{message}}` - Plain text message content
- `{{html_message}}` - HTML formatted content (optional)

### 2. `password-reset-template.html`
**Use Case**: Password reset emails
**Variables Required**:
- `{{to_email}}` - Recipient email address
- `{{to_name}}` - Recipient name
- `{{from_name}}` - Sender name (usually "Peercept")
- `{{subject}}` - Email subject line
- `{{reset_url}}` - Password reset URL

### 3. `course-invitation-template.html`
**Use Case**: Course invitation emails
**Variables Required**:
- `{{to_email}}` - Recipient email address
- `{{to_name}}` - Recipient name (optional)
- `{{from_name}}` - Sender name (usually "Peercept")
- `{{subject}}` - Email subject line
- `{{instructor_name}}` - Name of the instructor sending the invitation
- `{{course_name}}` - Name of the course
- `{{invitation_url}}` - Registration URL with invitation token

### 4. `registration-welcome-template.html`
**Use Case**: Welcome emails sent after successful student registration
**Variables Required**:
- `{{to_email}}` - Recipient email address
- `{{to_name}}` - Recipient name
- `{{from_name}}` - Sender name (usually "Peercept")
- `{{subject}}` - Email subject line
- `{{dashboard_url}}` - URL to the student dashboard

### 5. `email-verification-template.html`
**Use Case**: Email verification emails sent during registration process
**Variables Required**:
- `{{to_email}}` - Recipient email address
- `{{to_name}}` - Recipient name
- `{{from_name}}` - Sender name (usually "Peercept")
- `{{subject}}` - Email subject line
- `{{verification_url}}` - URL to verify email address

## How to Use These Templates

### Step 1: Choose Your Template
- For most use cases, use `general-template.html`
- For specific use cases, use the specialized templates

### Step 2: Set Up in EmailJS

1. **Login to EmailJS Dashboard**
   - Go to [EmailJS.com](https://www.emailjs.com/)
   - Navigate to your account dashboard

2. **Create Email Template**
   - Go to "Email Templates" section
   - Click "Create New Template"
   - Give it a meaningful name (e.g., "Peercept General Template")

3. **Copy HTML Content**
   - Copy the entire HTML content from one of the template files
   - Paste it into the EmailJS template editor
   - Make sure to use the "HTML" editor mode, not the visual editor

4. **Configure Template Variables**
   - EmailJS will automatically detect the `{{variable}}` placeholders
   - Make sure all required variables are properly mapped

### Step 3: Update Your Environment Variables

Make sure your `.env.local` includes:
```bash
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id  # Use the ID from the template you just created
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key
```

### Step 4: Test Your Setup

1. Start your development server: `npm run dev`
2. Try to trigger an email (e.g., password reset or course invitation)
3. Check the EmailJS dashboard for sent emails
4. Check the recipient's inbox

## Template Customization

### Colors
The templates use a purple color scheme (`#7c3aed`) to match Peercept branding. You can customize colors by modifying the CSS:

```css
/* Primary brand color */
color: #7c3aed;
background-color: #7c3aed;
border-left: 4px solid #7c3aed;

/* Text colors */
color: #4a5568;  /* Main text */
color: #718096;  /* Secondary text */
color: #a0aec0;  /* Muted text */
```

### Layout
The templates are responsive and will work well on both desktop and mobile devices. The maximum width is set to 600px for optimal email client compatibility.

### Adding Custom Variables

If you need additional variables, you can:

1. Add them to the HTML template using `{{variable_name}}` syntax
2. Update your EmailJS service calls to include the new variables
3. Make sure the variables are passed from your application code

## Troubleshooting

### Common Issues

1. **Template not found**: Make sure `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID` matches your EmailJS template ID
2. **Variables not rendering**: Check that variable names match exactly (case-sensitive)
3. **Styling issues**: Some email clients strip CSS - test with multiple email providers
4. **Links not working**: Make sure URLs include `http://` or `https://`

### Testing Tips

- Use EmailJS's test feature in the dashboard
- Send test emails to multiple email providers (Gmail, Outlook, etc.)
- Check both desktop and mobile email clients
- Verify all links work correctly

## Support

For EmailJS-specific issues, refer to the [EmailJS Documentation](https://www.emailjs.com/docs/).

For Peercept integration issues, check the main project documentation.
