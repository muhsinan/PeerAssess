// This is a mock email service
// In a real application, you would integrate with a proper email service
// like SendGrid, AWS SES, or Nodemailer

import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  // For development, you can use Gmail SMTP or any other SMTP service
  // For production on VM, you might want to use a different service
  
  // SENDGRID Configuration (Recommended - simple API key, 100 free emails/day)
  if (process.env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
  }
  
  // OUTLOOK Configuration (Requires OAuth2 - not recommended)
  /*
  return nodemailer.createTransport({
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER, // your outlook email
      pass: process.env.EMAIL_PASSWORD // your outlook password (regular password, not app password)
    },
    tls: {
      rejectUnauthorized: false,
      ciphers: 'SSLv3'
    }
  });
  */
  
  // GMAIL Alternative (Requires App Password)
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Function to send emails
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  // Debug: Check if environment variables are loaded
  console.log('🔍 DEBUG - Email credentials check:');
  console.log('SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? 'SET' : 'NOT SET');
  console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'SET' : 'NOT SET');
  console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? 'SET (length: ' + process.env.EMAIL_PASSWORD.length + ')' : 'NOT SET');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  
  // In development, show a mock email if no real email credentials are provided
  if (process.env.NODE_ENV === 'development' && (!process.env.SENDGRID_API_KEY && (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD))) {
    console.log('====== MOCK EMAIL (No credentials provided) ======');
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log('Body:');
    console.log(options.text);
    console.log('HTML:');
    console.log(options.html || 'No HTML content');
    console.log('===============================================');
    console.log('To send real emails, set SENDGRID_API_KEY or EMAIL_USER/EMAIL_PASSWORD environment variables');
    return true;
  }

  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"PeerAssess" <${process.env.SENDGRID_SENDER_EMAIL || process.env.EMAIL_USER || 'noreply@peerassess.com'}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html || options.text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    
    // In development, fall back to console logging if email fails
    if (process.env.NODE_ENV === 'development') {
      console.log('====== FALLBACK MOCK EMAIL (Send failed) ======');
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log('Body:');
      console.log(options.text);
      console.log('============================================');
    }
    
    return false;
  }
};

// Function to send a password reset email
export const sendPasswordResetEmail = async (
  email: string, 
  name: string, 
  resetToken: string
): Promise<boolean> => {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
  
  const subject = 'Password Reset Request';
  const text = `
    Hello ${name},
    
    You requested a password reset for your PeerAssess account.
    
    Please click the link below to reset your password:
    ${resetUrl}
    
    This link is valid for 1 hour.
    
    If you didn't request this, please ignore this email.
    
    Best regards,
    PeerAssess Team
  `;
  
  return await sendEmail({
    to: email,
    subject,
    text
  });
};

// Function to send a course invitation email
export const sendCourseInvitationEmail = async (
  email: string,
  courseName: string,
  instructorName: string,
  invitationToken: string
): Promise<boolean> => {
  const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/register?invitation=${invitationToken}`;
  
  const subject = `Invitation to join ${courseName} on PeerAssess`;
  const text = `
    Hello,
    
    You have been invited by ${instructorName} to join the course "${courseName}" on PeerAssess.
    
    To accept this invitation and create your account, please click the link below:
    ${invitationUrl}
    
    This invitation is valid for 7 days. After registering, you will be automatically enrolled in the course.
    
    If you didn't expect this invitation, you can safely ignore this email.
    
    Best regards,
    PeerAssess Team
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
          <h1 style="color: #7c3aed; margin: 0; font-size: 28px;">PeerAssess</h1>
          <p style="color: #666; margin: 5px 0 0 0;">Academic Peer Review Platform</p>
        </div>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 6px; border-left: 4px solid #7c3aed; margin-bottom: 25px;">
          <h2 style="color: #7c3aed; margin: 0 0 10px 0; font-size: 20px;">Course Invitation</h2>
          <p style="margin: 0; color: #4a5568;">You've been invited to join a course!</p>
        </div>
        
        <p style="color: #4a5568; line-height: 1.6; margin-bottom: 20px;">Hello,</p>
        
        <p style="color: #4a5568; line-height: 1.6; margin-bottom: 20px;">
          You have been invited by <strong style="color: #2d3748;">${instructorName}</strong> to join the course 
          <strong style="color: #2d3748;">"${courseName}"</strong> on PeerAssess.
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
            <strong>PeerAssess Team</strong>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return await sendEmail({
    to: email,
    subject,
    text,
    html
  });
}; 