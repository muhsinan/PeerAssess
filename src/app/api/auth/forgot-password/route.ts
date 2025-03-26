import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { createResetToken } from '@/lib/reset-tokens';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { email } = await request.json();

    // Validate input
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const result = await pool.query(
      'SELECT user_id, name, email FROM peer_assessment.users WHERE email = $1',
      [email]
    );

    // For security reasons, we don't want to reveal whether a user exists or not
    // We'll always return a success response, even if the email is not found
    if (result.rows.length === 0) {
      // No user found with that email, but we don't want to reveal that
      // Just pretend we sent an email
      return NextResponse.json({
        message: 'If an account exists with that email, a password reset link has been sent'
      });
    }

    const user = result.rows[0];
    
    // Generate a password reset token
    const resetToken = await createResetToken(user.user_id);
    
    // Send password reset email
    await sendPasswordResetEmail(user.email, user.name, resetToken);
    
    // Return success response
    return NextResponse.json({
      message: 'If an account exists with that email, a password reset link has been sent'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    );
  }
} 