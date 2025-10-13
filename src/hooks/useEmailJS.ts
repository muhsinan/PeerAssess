'use client';

import { useEffect } from 'react';
import emailjs from '@emailjs/browser';

interface EmailData {
  to: string;
  subject: string;
  instructor_name?: string;
  course_name?: string;
  invitation_url?: string;
  reset_url?: string;
  [key: string]: any;
}

export const useEmailJS = () => {
  useEffect(() => {
    // Initialize EmailJS
    if (process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY) {
      emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY);
    }
  }, []);

  const sendEmail = async (emailData: EmailData): Promise<boolean> => {
    // Check if EmailJS is configured
    if (!process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || 
        !process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || 
        !process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY) {
      console.error('EmailJS not configured');
      return false;
    }

    try {
<<<<<<< HEAD
      // Avoid duplicate keys by separating subject before spreading
      const { subject, ...rest } = emailData;
      const templateParams = {
        to_email: emailData.to,
        from_name: 'Peercept',
        message: `You have received an invitation.`,
        ...rest,
        subject
=======
      const templateParams = {
        to_email: emailData.to,
        from_name: 'Peercept',
        subject: emailData.subject,
        message: `You have received an invitation.`,
        // Include all email data as template variables
        ...emailData
>>>>>>> 00a451961209e4e4094cc9b5992ef6bdca1353b8
      };

      const response = await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
        templateParams
      );

      console.log('Email sent successfully via EmailJS:', response.status);
      return true;
    } catch (error) {
      console.error('EmailJS sending error:', error);
      return false;
    }
  };

  const sendInvitationEmail = async (emailData: EmailData): Promise<boolean> => {
    return await sendEmail(emailData);
  };

  const sendPasswordResetEmail = async (emailData: EmailData): Promise<boolean> => {
    // Use a specific template for password reset if available, otherwise use general template
    const passwordResetTemplateId = process.env.NEXT_PUBLIC_EMAILJS_PASSWORD_RESET_TEMPLATE_ID;
    
    if (passwordResetTemplateId) {
      // Use dedicated password reset template
      try {
<<<<<<< HEAD
        const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
        if (!serviceId) {
          console.error('EmailJS service ID not configured');
          return false;
        }
        const templateId: string = passwordResetTemplateId;
=======
>>>>>>> 00a451961209e4e4094cc9b5992ef6bdca1353b8
        const templateParams = {
          to_email: emailData.to,
          to_name: emailData.to_name || '',
          from_name: 'Peercept',
          subject: emailData.subject,
          message: `You have requested a password reset.`,
          reset_url: emailData.reset_url || ''
        };

<<<<<<< HEAD
        const response = await emailjs.send(serviceId, templateId, templateParams);
=======
        const response = await emailjs.send(
          process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
          passwordResetTemplateId,
          templateParams
        );
>>>>>>> 00a451961209e4e4094cc9b5992ef6bdca1353b8

        console.log('Password reset email sent successfully via EmailJS:', response.status);
        return true;
      } catch (error) {
        console.error('Password reset EmailJS sending error:', error);
        return false;
      }
    } else {
      // Fallback to general template - map reset_url to invitation_url for compatibility
      const compatibleEmailData = {
        ...emailData,
        invitation_url: emailData.reset_url, // Map reset_url to invitation_url for template compatibility
        instructor_name: 'Peercept Support',
        course_name: 'Password Reset'
      };
      return await sendEmail(compatibleEmailData);
    }
  };

  return {
    sendEmail,
    sendInvitationEmail,
    sendPasswordResetEmail
  };
};
