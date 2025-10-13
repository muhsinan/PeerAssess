'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import emailjs from '@emailjs/browser';

interface EmailData {
  to: string;
  toName?: string;
  subject: string;
  text: string;
  html?: string;
}

interface EmailJSContextType {
  sendEmail: (emailData: EmailData) => Promise<boolean>;
  isEmailJSConfigured: boolean;
}

const EmailJSContext = createContext<EmailJSContextType | undefined>(undefined);

export const useEmailJS = () => {
  const context = useContext(EmailJSContext);
  if (!context) {
    throw new Error('useEmailJS must be used within an EmailJSProvider');
  }
  return context;
};

interface EmailJSProviderProps {
  children: React.ReactNode;
}

export const EmailJSProvider: React.FC<EmailJSProviderProps> = ({ children }) => {
  const [isEmailJSConfigured, setIsEmailJSConfigured] = useState(false);

  useEffect(() => {
    // Check if EmailJS is configured
    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
    
    if (serviceId && templateId && publicKey) {
      emailjs.init(publicKey);
      setIsEmailJSConfigured(true);
    }
  }, []);

  const sendEmail = async (emailData: EmailData): Promise<boolean> => {
    if (!isEmailJSConfigured) {
      console.error('EmailJS is not configured');
      return false;
    }

    try {
      const templateParams = {
        to_email: emailData.to,
        to_name: emailData.toName || '',
        from_name: 'Peercept',
        subject: emailData.subject,
        message: emailData.text,
        html_message: emailData.html || emailData.text
      };

      const response = await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
        templateParams
      );

      console.log('Email sent successfully via EmailJS:', response.status);
      return true;
    } catch (error) {
      console.error('EmailJS sending error:', error);
      return false;
    }
  };

  return (
    <EmailJSContext.Provider value={{ sendEmail, isEmailJSConfigured }}>
      {children}
    </EmailJSContext.Provider>
  );
};
