// This is a mock email service
// In a real application, you would integrate with a proper email service
// like SendGrid, AWS SES, or Nodemailer

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

// Mock function to "send" emails (just logs to console in development)
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  // In development, just log the email
  if (process.env.NODE_ENV === 'development') {
    console.log('====== MOCK EMAIL ======');
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log('Body:');
    console.log(options.text);
    console.log('========================');
    return true;
  }
  
  // In production, you would integrate with a real email service
  // Example with SendGrid:
  /*
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  try {
    await sgMail.send({
      to: options.to,
      from: 'your-verified-sender@example.com',
      subject: options.subject,
      text: options.text,
      html: options.html || options.text,
    });
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
  */
  
  // For now, just pretend we sent the email
  return true;
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