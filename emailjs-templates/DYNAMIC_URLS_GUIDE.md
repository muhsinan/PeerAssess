# Dynamic URLs in EmailJS Templates

## The Problem
Each student needs a **unique invitation URL** with their specific invitation token. You can't hardcode URLs in EmailJS templates because each email needs different parameters.

## The Solution ✅

The system now **automatically generates unique URLs** for each student and passes them to EmailJS as template variables.

## How It Works

### 1. **Your Application Code** (Server-side)
```javascript
// When inviting a student
const invitationToken = await createInvitationToken(courseId, email, instructorId);

// This automatically creates a unique URL for THIS student
const emailSent = await sendCourseInvitationEmail(
  email, 
  courseName, 
  instructorName, 
  invitationToken  // ← Unique token for this student
);
```

### 2. **EmailJS Function** (Automatically handled)
```javascript
// The system automatically creates unique URLs:
const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/register?invitation=${invitationToken}`;

// Then passes it to EmailJS template:
await sendEmailJS({
  to: email,
  subject: `Invitation to join ${courseName}`,
  instructor_name: instructorName,
  course_name: courseName,
  invitation_url: invitationUrl  // ← Unique URL for this student
});
```

### 3. **EmailJS Template** (What you set up)
```html
<!-- Your template uses variables: -->
<a href="{{invitation_url}}" class="button">
  Accept Invitation & Register
</a>

<!-- EmailJS automatically replaces {{invitation_url}} with the unique URL -->
```

## Email Template Variables

### Course Invitation Emails
- `{{to_email}}` - Student's email
- `{{to_name}}` - Student's name (if provided)
- `{{from_name}}` - "Peercept"
- `{{subject}}` - Email subject
- `{{instructor_name}}` - Instructor who sent invitation
- `{{course_name}}` - Course name
- `{{invitation_url}}` - **Unique URL for this student**

### Password Reset Emails
- `{{to_email}}` - User's email
- `{{to_name}}` - User's name
- `{{from_name}}` - "Peercept"
- `{{subject}}` - Email subject
- `{{reset_url}}` - **Unique reset URL for this user**

## Setting Up EmailJS Template

### Step 1: Create Template in EmailJS Dashboard
1. Go to [EmailJS Dashboard](https://www.emailjs.com/)
2. Click "Create New Template"
3. Copy the HTML from `course-invitation-template.html`
4. Paste into EmailJS template editor

### Step 2: Verify Variables
Make sure these variables are detected by EmailJS:
- `{{invitation_url}}`
- `{{instructor_name}}`
- `{{course_name}}`
- `{{to_email}}`
- `{{from_name}}`
- `{{subject}}`

### Step 3: Test Template
Use EmailJS test feature with sample data:
```json
{
  "to_email": "test@example.com",
  "from_name": "Peercept",
  "subject": "Test Invitation",
  "instructor_name": "John Doe",
  "course_name": "Computer Science 101",
  "invitation_url": "https://yourapp.com/register?invitation=sample123"
}
```

## How Students Get Unique URLs

### For Each Student Invitation:
1. **System creates unique token**: `abc123def456` (different for each student)
2. **System builds unique URL**: `https://yourapp.com/register?invitation=abc123def456`
3. **System sends email**: EmailJS template gets the unique URL
4. **Student clicks link**: They go to their specific registration page
5. **System validates token**: Only that student can use that specific token

### Example Flow:
```
Student A: https://yourapp.com/register?invitation=token_A
Student B: https://yourapp.com/register?invitation=token_B  
Student C: https://yourapp.com/register?invitation=token_C
```

## Bulk Invitations

When you send bulk invitations:

```javascript
// For each email in the list:
emails.forEach(async (email) => {
  // Creates UNIQUE token for THIS email
  const invitationToken = await createInvitationToken(courseId, email, instructorId);
  
  // Sends email with UNIQUE URL for THIS student
  await sendCourseInvitationEmail(email, courseName, instructorName, invitationToken);
});
```

**Result**: Each student gets their own unique invitation link!

## Testing Your Setup

### 1. **Set Environment Variables**
```bash
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. **Test with Real Invitations**
1. Start your app: `npm run dev`
2. Create a course
3. Try to add a student with an email that doesn't exist
4. Check that the invitation email is sent
5. Verify the invitation URL is unique and working

### 3. **Test Bulk Invitations**
1. Use the bulk upload feature
2. Upload multiple email addresses
3. Each should get a unique invitation link

## Troubleshooting

### "URL not working"
- Check `NEXT_PUBLIC_APP_URL` is set correctly
- Verify the invitation token is valid in your database

### "Template variables not showing"
- Make sure variable names match exactly: `{{invitation_url}}` not `{{invitationUrl}}`
- Check EmailJS dashboard shows the variables are detected

### "All students get same URL"
- This shouldn't happen with the updated code
- Check that `createInvitationToken()` is being called for each email

## Security Benefits

✅ **Each token is unique** - No student can use another's link  
✅ **Tokens expire** - Links only work for 7 days  
✅ **One-time use** - Token becomes invalid after registration  
✅ **Tied to email** - Token only works for the intended recipient  

## Summary

You **don't need to manually add URLs** anywhere! The system automatically:

1. ✅ Creates unique invitation tokens for each student
2. ✅ Builds unique URLs with those tokens  
3. ✅ Passes those URLs to EmailJS templates
4. ✅ Sends personalized emails to each student

Just set up your EmailJS template with the variables, and everything works automatically! 🎉
