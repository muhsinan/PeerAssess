import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyEmailVerificationToken, markEmailVerificationTokenAsUsed } from '@/lib/email-verification-tokens';
import { verifyInvitationToken, acceptInvitation } from '@/lib/invitation-tokens';
import { sendRegistrationWelcomeEmail } from '@/lib/emailjs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }
    
    // Verify the email verification token
    const verificationData = await verifyEmailVerificationToken(token);
    
    if (!verificationData) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 404 }
      );
    }
    
    // Begin transaction to create user and handle course enrollment
    await pool.query('BEGIN');
    
    try {
      // Create the user account
      const userResult = await pool.query(
        'INSERT INTO peer_assessment.users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING user_id, name, email, role',
        [verificationData.name, verificationData.email, verificationData.password_hash, 'student']
      );
      
      const newUser = userResult.rows[0];
      
      let courseInfo = null;
      
      // Handle invitation-based registration
      if (verificationData.invitation_token) {
        const invitation = await verifyInvitationToken(verificationData.invitation_token);
        if (invitation) {
          // Enroll the student in the course
          await pool.query(
            'INSERT INTO peer_assessment.course_enrollments (course_id, student_id) VALUES ($1, $2)',
            [invitation.course_id, newUser.user_id]
          );
          
          // Mark invitation as accepted
          await acceptInvitation(verificationData.invitation_token);
          
          courseInfo = {
            id: invitation.course_id,
            name: invitation.course_name,
            instructor: invitation.instructor_name,
            status: 'enrolled'
          };
        }
      }
      // Handle course selection during registration
      else if (verificationData.selected_course_id) {
        // Validate that the course exists
        const courseCheck = await pool.query(
          'SELECT course_id, name FROM peer_assessment.courses WHERE course_id = $1',
          [verificationData.selected_course_id]
        );
        
        if (courseCheck.rows.length > 0) {
          // Create a pending enrollment request
          await pool.query(
            'INSERT INTO peer_assessment.pending_enrollment_requests (course_id, student_id, student_name, student_email) VALUES ($1, $2, $3, $4)',
            [verificationData.selected_course_id, newUser.user_id, verificationData.name, verificationData.email]
          );
          
          const courseData = await pool.query(
            'SELECT c.course_id, c.name, u.name as instructor_name FROM peer_assessment.courses c JOIN peer_assessment.users u ON c.instructor_id = u.user_id WHERE c.course_id = $1',
            [verificationData.selected_course_id]
          );
          
          if (courseData.rows.length > 0) {
            const course = courseData.rows[0];
            courseInfo = {
              id: course.course_id,
              name: course.name,
              instructor: course.instructor_name,
              status: 'pending'
            };
          }
        }
      }
      
      // Mark the verification token as used
      await markEmailVerificationTokenAsUsed(token);
      
      // Commit transaction
      await pool.query('COMMIT');
      
      // Send welcome email
      try {
        await sendRegistrationWelcomeEmail(verificationData.email, verificationData.name);
        console.log('Welcome email sent successfully to:', verificationData.email);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail the verification if welcome email fails
      }
      
      // Prepare response message
      let message = 'Email verified successfully! Your account has been created.';
      if (courseInfo) {
        if (courseInfo.status === 'enrolled') {
          message = `Email verified successfully! You have been enrolled in ${courseInfo.name}.`;
        } else if (courseInfo.status === 'pending') {
          message = `Email verified successfully! Your request to join "${courseInfo.name}" has been submitted and is pending instructor approval.`;
        }
      }
      
      return NextResponse.json({
        success: true,
        message,
        user: {
          id: newUser.user_id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role
        },
        ...(courseInfo && { courseInfo })
      });
      
    } catch (transactionError) {
      // Rollback transaction
      await pool.query('ROLLBACK');
      throw transactionError;
    }
    
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Email verification failed. Please try again.' },
      { status: 500 }
    );
  }
}
