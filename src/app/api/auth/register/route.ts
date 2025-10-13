import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { verifyInvitationToken, acceptInvitation } from '@/lib/invitation-tokens';
import { createEmailVerificationToken } from '@/lib/email-verification-tokens';
import { sendEmailVerificationEmail } from '@/lib/emailjs';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { name, email, password, role = 'student', invitationToken, selectedCourseId } = await request.json();

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate email domain for students (must be @metu.edu.tr)
    if (role === 'student' && !email.toLowerCase().endsWith('@metu.edu.tr')) {
      return NextResponse.json(
        { error: 'Students must use a @metu.edu.tr email address' },
        { status: 400 }
      );
    }

    // Only allow student role for regular registration
    if (role !== 'student') {
      return NextResponse.json(
        { error: 'Only student registration is allowed through this endpoint' },
        { status: 400 }
      );
    }

    // If invitation token is provided, verify it
    let invitation = null;
    if (invitationToken) {
      invitation = await verifyInvitationToken(invitationToken);
      if (!invitation) {
        return NextResponse.json(
          { error: 'Invalid or expired invitation token' },
          { status: 400 }
        );
      }
      
      // Make sure the email matches the invitation
      if (invitation.student_email !== email) {
        return NextResponse.json(
          { error: 'Email does not match the invitation' },
          { status: 400 }
        );
      }
      
      // For invitation registrations, role must be student
      if (role !== 'student') {
        return NextResponse.json(
          { error: 'Invitation registrations must be for student role' },
          { status: 400 }
        );
      }
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT * FROM peer_assessment.users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create email verification token instead of creating user immediately
    try {
      const verificationToken = await createEmailVerificationToken(
        email,
        name,
        hashedPassword,
        selectedCourseId,
        invitationToken
      );

      console.log('Verification token created for:', email);

      // Return success response with token for frontend to send email
      return NextResponse.json(
        {
          message: 'Registration initiated! Please check your email and click the verification link to complete your registration.',
          requiresVerification: true,
          email: email,
          verificationToken: verificationToken
        },
        { status: 200 }
      );
    } catch (error) {
      console.error('Failed to create verification token:', error);
      return NextResponse.json(
        { error: 'Registration failed. Please try again.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
} 