import emailjs from '@emailjs/browser';

// Initialize EmailJS with your public key
const initEmailJS = () => {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY) {
    emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY);
  }
};

// Initialize on module load
initEmailJS();

interface EmailJSParams {
  to_email: string;
  to_name?: string;
  from_name: string;
  subject: string;
  message: string;
  html_message?: string;
}

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  toName?: string;
  // Allow additional template variables
  [key: string]: any;
}

// Function to send emails using EmailJS
export const sendEmailJS = async (options: EmailOptions): Promise<boolean> => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    console.error('EmailJS can only be used in browser environment');
    return false;
  }

  // Debug: Check if environment variables are loaded
  console.log('🔍 DEBUG - EmailJS credentials check:');
  console.log('EMAILJS_SERVICE_ID:', process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID ? 'SET' : 'NOT SET');
  console.log('EMAILJS_TEMPLATE_ID:', process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID ? 'SET' : 'NOT SET');
  console.log('EMAILJS_PUBLIC_KEY:', process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY ? 'SET' : 'NOT SET');
  console.log('NODE_ENV:', process.env.NODE_ENV);

  // Check if required environment variables are set
  if (!process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || 
      !process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || 
      !process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY) {
    
    // In development, show a mock email if no real email credentials are provided
    if (process.env.NODE_ENV === 'development') {
      console.log('====== MOCK EMAIL (EmailJS credentials not provided) ======');
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log('Body:');
      console.log(options.text);
      console.log('HTML:');
      console.log(options.html || 'No HTML content');
      console.log('================================================================');
      console.log('To send real emails with EmailJS, set the following environment variables:');
      console.log('- NEXT_PUBLIC_EMAILJS_SERVICE_ID');
      console.log('- NEXT_PUBLIC_EMAILJS_TEMPLATE_ID');
      console.log('- NEXT_PUBLIC_EMAILJS_PUBLIC_KEY');
      return true;
    }
    
    console.error('EmailJS environment variables not configured');
    return false;
  }

  try {
    // Prepare template parameters for EmailJS
    const { to, subject, text, html, toName, ...additionalParams } = options;
    const templateParams: any = {
      to_email: to,
      to_name: toName || '',
      from_name: 'Peercept',
      subject: subject,
      message: text,
      html_message: html || text,
      // Add any additional parameters passed in options
      ...additionalParams
    };

    console.log('📤 Sending email with params:', templateParams);

    // Send email using EmailJS
    const response = await emailjs.send(
      process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
      process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
      templateParams
    );

    console.log('✅ Email sent successfully via EmailJS:', response.status, response.text);
    return true;
  } catch (error) {
    console.error('❌ EmailJS sending error:', error);
    
    // In development, fall back to console logging if email fails
    if (process.env.NODE_ENV === 'development') {
      console.log('====== FALLBACK MOCK EMAIL (EmailJS send failed) ======');
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log('Body:');
      console.log(options.text);
    }
    
    return false;
  }
};

// Function to send a password reset email using EmailJS
export const sendPasswordResetEmailJS = async (
  email: string, 
  name: string, 
  resetToken: string
): Promise<boolean> => {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
  
  const subject = 'Password Reset Request';
  const text = `
    Hello ${name},
    
    You requested a password reset for your Peercept account.
    
    Please click the link below to reset your password:
    ${resetUrl}
    
    This link is valid for 1 hour.
    
    If you didn't request this, please ignore this email.
    
    Best regards,
    Peercept Team
  `;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset Request</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #7c3aed; margin: 0; font-size: 28px;">Peercept</h1>
          <p style="color: #666; margin: 5px 0 0 0;">Academic Peer Review Platform</p>
        </div>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 6px; border-left: 4px solid #7c3aed; margin-bottom: 25px;">
          <h2 style="color: #7c3aed; margin: 0 0 10px 0; font-size: 20px;">Password Reset Request</h2>
          <p style="margin: 0; color: #4a5568;">You've requested to reset your password.</p>
        </div>
        
        <p style="color: #4a5568; line-height: 1.6; margin-bottom: 20px;">Hello ${name},</p>
        
        <p style="color: #4a5568; line-height: 1.6; margin-bottom: 20px;">
          You requested a password reset for your Peercept account.
        </p>
        
        <p style="color: #4a5568; line-height: 1.6; margin-bottom: 30px;">
          Please click the button below to reset your password:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #7c3aed; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">
            Reset Password
          </a>
        </div>
        
        <div style="background-color: #f7fafc; padding: 15px; border-radius: 4px; margin: 25px 0;">
          <p style="margin: 0; font-size: 14px; color: #718096;">
            <strong>Can't click the button?</strong> Copy and paste this link into your browser:<br>
            <a href="${resetUrl}" style="color: #7c3aed; word-break: break-all;">${resetUrl}</a>
          </p>
        </div>
        
        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
          <p style="color: #718096; font-size: 14px; line-height: 1.5; margin-bottom: 10px;">
            <strong>Important:</strong> This link is valid for 1 hour.
          </p>
          <p style="color: #718096; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
            If you didn't request this, please ignore this email.
          </p>
        </div>
        
        <div style="text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 20px;">
          <p style="color: #a0aec0; font-size: 12px; margin: 0;">
            Best regards,<br>
            <strong>Peercept Team</strong>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return await sendEmailJS({
    to: email,
    toName: name,
    subject,
    text,
    html,
    // Additional variables for EmailJS template
    reset_url: resetUrl
  });
};

// Function to send a course invitation email using EmailJS
export const sendCourseInvitationEmailJS = async (
  email: string,
  courseName: string,
  instructorName: string,
  invitationToken: string
): Promise<boolean> => {
  const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/register?invitation=${invitationToken}`;
  
  const subject = `Invitation to join ${courseName} on Peercept`;
  const text = `
    Hello,
    
    You have been invited by ${instructorName} to join the course "${courseName}" on Peercept.
    
    To accept this invitation and create your account, please click the link below:
    ${invitationUrl}
    
    This invitation is valid for 7 days. After registering, you will be automatically enrolled in the course.
    
    If you didn't expect this invitation, you can safely ignore this email.
    
    Best regards,
    Peercept Team
  `;
  
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Course Invitation</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #7c3aed; margin: 0; font-size: 28px;">Peercept</h1>
          <p style="color: #666; margin: 5px 0 0 0;">Academic Peer Review Platform</p>
        </div>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 6px; border-left: 4px solid #7c3aed; margin-bottom: 25px;">
          <h2 style="color: #7c3aed; margin: 0 0 10px 0; font-size: 20px;">Course Invitation</h2>
          <p style="margin: 0; color: #4a5568;">You've been invited to join a course!</p>
        </div>
        
        <p style="color: #4a5568; line-height: 1.6; margin-bottom: 20px;">Hello,</p>
        
        <p style="color: #4a5568; line-height: 1.6; margin-bottom: 20px;">
          You have been invited by <strong style="color: #2d3748;">${instructorName}</strong> to join the course 
          <strong style="color: #2d3748;">"${courseName}"</strong> on Peercept.
        </p>
        
        <p style="color: #4a5568; line-height: 1.6; margin-bottom: 30px;">
          To accept this invitation and create your account, please click the button below:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${invitationUrl}" 
             style="background-color: #7c3aed; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">
            Accept Invitation & Register
          </a>
        </div>
        
        <div style="background-color: #f7fafc; padding: 15px; border-radius: 4px; margin: 25px 0;">
          <p style="margin: 0; font-size: 14px; color: #718096;">
            <strong>Can't click the button?</strong> Copy and paste this link into your browser:<br>
            <a href="${invitationUrl}" style="color: #7c3aed; word-break: break-all;">${invitationUrl}</a>
          </p>
        </div>
        
        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
          <p style="color: #718096; font-size: 14px; line-height: 1.5; margin-bottom: 10px;">
            <strong>Important:</strong> This invitation is valid for 7 days. After registering, you will be automatically enrolled in the course.
          </p>
          <p style="color: #718096; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
        
        <div style="text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 20px;">
          <p style="color: #a0aec0; font-size: 12px; margin: 0;">
            Best regards,<br>
            <strong>Peercept Team</strong>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return await sendEmailJS({
    to: email,
    subject,
    text,
    html,
    // Additional variables for EmailJS template
    instructor_name: instructorName,
    course_name: courseName,
    invitation_url: invitationUrl
  });
};

// Function to send a registration welcome email using EmailJS
export const sendRegistrationWelcomeEmailJS = async (
  email: string,
  name: string
): Promise<boolean> => {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`;
  
  const subject = 'Welcome to Peercept - Account Created Successfully';
  const text = `
    Hello ${name},
    
    Welcome to Peercept! Your student account has been successfully created with the email address ${email}.
    
    You can now access your dashboard to view courses, submit assignments, and participate in peer reviews.
    
    Visit your dashboard: ${dashboardUrl}
    
    What you can do with Peercept:
    • Submit Assignments: Upload your work and receive feedback
    • Peer Reviews: Review and provide feedback on classmates' work
    • Track Progress: Monitor your submissions and review history
    • Course Enrollment: Request to join additional courses
    • AI-Powered Insights: Get intelligent feedback and suggestions
    
    Important: Keep your login credentials secure and don't share them with others.
    
    If you have any technical issues or questions about the platform, please contact your course instructor.
    
    Best regards,
    Peercept Team
  `;
  
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Peercept</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #7c3aed; margin: 0; font-size: 28px;">Peercept</h1>
          <p style="color: #666; margin: 5px 0 0 0;">Academic Peer Review Platform</p>
        </div>
        
        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 6px; border-left: 4px solid #0ea5e9; margin-bottom: 25px;">
          <h2 style="color: #0ea5e9; margin: 0 0 10px 0; font-size: 20px;">Welcome to Peercept!</h2>
          <p style="margin: 0; color: #0c4a6e;">Your account has been successfully created.</p>
        </div>
        
        <p style="color: #4a5568; line-height: 1.6; margin-bottom: 20px;">Hello <strong style="color: #2d3748;">${name}</strong>,</p>
        
        <p style="color: #4a5568; line-height: 1.6; margin-bottom: 20px;">
          Welcome to <strong>Peercept</strong>! Your student account has been successfully created with the email address 
          <strong style="color: #2d3748;">${email}</strong>.
        </p>
        
        <p style="color: #4a5568; line-height: 1.6; margin-bottom: 30px;">
          You can now access your dashboard to view courses, submit assignments, and participate in peer reviews.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${dashboardUrl}" 
             style="background-color: #7c3aed; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">
            Go to Dashboard
          </a>
        </div>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 6px; margin: 25px 0;">
          <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 16px;">What you can do with Peercept:</h3>
          <ul style="margin: 0; padding-left: 20px; color: #4a5568;">
            <li style="margin-bottom: 8px;"><strong>Submit Assignments:</strong> Upload your work and receive feedback</li>
            <li style="margin-bottom: 8px;"><strong>Peer Reviews:</strong> Review and provide feedback on classmates' work</li>
            <li style="margin-bottom: 8px;"><strong>Track Progress:</strong> Monitor your submissions and review history</li>
            <li style="margin-bottom: 8px;"><strong>Course Enrollment:</strong> Request to join additional courses</li>
            <li style="margin-bottom: 8px;"><strong>AI-Powered Insights:</strong> Get intelligent feedback and suggestions</li>
          </ul>
        </div>
        
        <div style="background-color: #f7fafc; padding: 15px; border-radius: 4px; margin: 25px 0;">
          <p style="margin: 0; font-size: 14px; color: #718096;">
            <strong>Need help getting started?</strong> Visit your dashboard and explore the available courses and assignments.
            If you have any questions, don't hesitate to contact your instructors.
          </p>
        </div>
        
        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
          <p style="color: #718096; font-size: 14px; line-height: 1.5; margin-bottom: 10px;">
            <strong>Important:</strong> Keep your login credentials secure and don't share them with others.
          </p>
          <p style="color: #718096; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
            If you have any technical issues or questions about the platform, please contact your course instructor.
          </p>
        </div>
        
        <div style="text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 20px;">
          <p style="color: #a0aec0; font-size: 12px; margin: 0;">
            Best regards,<br>
            <strong>Peercept Team</strong>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return await sendEmailJS({
    to: email,
    toName: name,
    subject,
    text,
    html,
    // Additional variables for EmailJS template
    dashboard_url: dashboardUrl
  });
};

// Function to send an email verification email using EmailJS
export const sendEmailVerificationEmailJS = async (
  email: string,
  name: string,
  verificationToken: string
): Promise<boolean> => {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
  
  const subject = 'Verify Your Email Address - Peercept Registration';
  
  console.log('📧 EmailJS Debug Info:');
  console.log('- Service ID:', process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID);
  console.log('- Template ID:', process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID);
  console.log('- Public Key:', process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY);
  console.log('- Verification URL:', verificationUrl);
  
  // Create content for email verification
  const text = `Welcome to Peercept! Please verify your email address to complete your registration.

Click the link below to verify your email:
${verificationUrl}

This verification link will expire in 24 hours.

If you didn't create an account with Peercept, please ignore this email.`;
  
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email - Peercept</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #7c3aed; margin: 0; font-size: 28px;">Peercept</h1>
          <p style="color: #666; margin: 5px 0 0 0;">Academic Peer Review Platform</p>
        </div>
        
        <div style="background-color: #fef3c7; padding: 20px; border-radius: 6px; border-left: 4px solid #f59e0b; margin-bottom: 25px;">
          <h2 style="color: #d97706; margin: 0 0 10px 0; font-size: 20px;">Verify Your Email Address</h2>
          <p style="margin: 0; color: #92400e;">Please confirm your email to complete registration.</p>
        </div>
        
        <p style="color: #4a5568; line-height: 1.6; margin-bottom: 20px;">Hello <strong style="color: #2d3748;">${name}</strong>,</p>
        
        <p style="color: #4a5568; line-height: 1.6; margin-bottom: 20px;">
          Thank you for registering with <strong>Peercept</strong>! To complete your registration and activate your account, 
          please verify your email address <strong style="color: #2d3748;">${email}</strong>.
        </p>
        
        <p style="color: #4a5568; line-height: 1.6; margin-bottom: 30px;">
          Click the button below to verify your email and complete your registration:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #7c3aed; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">
            Verify Email & Complete Registration
          </a>
        </div>
        
        <div style="background-color: #f7fafc; padding: 15px; border-radius: 4px; margin: 25px 0;">
          <p style="margin: 0; font-size: 14px; color: #718096;">
            <strong>Can't click the button?</strong> Copy and paste this link into your browser:<br>
            <a href="${verificationUrl}" style="color: #7c3aed; word-break: break-all;">${verificationUrl}</a>
          </p>
        </div>
        
        <div style="background-color: #fef2f2; padding: 15px; border-radius: 4px; border-left: 4px solid #ef4444; margin: 25px 0;">
          <p style="margin: 0; font-size: 14px; color: #dc2626;">
            <strong>Important:</strong> This verification link will expire in 24 hours. If you don't verify your email within this time, 
            you'll need to register again.
          </p>
        </div>
        
        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
          <p style="color: #718096; font-size: 14px; line-height: 1.5; margin-bottom: 10px;">
            <strong>Security Note:</strong> If you didn't create an account with Peercept, please ignore this email. 
            Your email address will not be used without verification.
          </p>
          <p style="color: #718096; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
            This email was sent because someone attempted to register an account with your email address on Peercept.
          </p>
        </div>
        
        <div style="text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 20px;">
          <p style="color: #a0aec0; font-size: 12px; margin: 0;">
            Best regards,<br>
            <strong>Peercept Team</strong>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  // Use EmailJS directly with proper template parameters for general template
  try {
    const templateParams = {
      to_email: email,
      to_name: name,
      from_name: 'Peercept',
      subject: subject,
      message: text,
      html_message: html,
      verification_url: verificationUrl
    };

    console.log('📤 Sending verification email with params:', templateParams);

    const response = await emailjs.send(
      process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
      process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
      templateParams
    );

    console.log('✅ Verification email sent successfully:', response.status, response.text);
    return true;
  } catch (error) {
    console.error('❌ Failed to send verification email:', error);
    return false;
  }
};

// Compatibility wrapper to maintain existing API but use EmailJS
export const sendEmail = sendEmailJS;
export const sendPasswordResetEmail = sendPasswordResetEmailJS;
export const sendCourseInvitationEmail = sendCourseInvitationEmailJS;
export const sendRegistrationWelcomeEmail = sendRegistrationWelcomeEmailJS;
export const sendEmailVerificationEmail = sendEmailVerificationEmailJS;
