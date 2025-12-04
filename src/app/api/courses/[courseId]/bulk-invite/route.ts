import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { createInvitationToken } from '@/lib/invitation-tokens';

interface InvitationResult {
  email: string;
  status: 'success' | 'error' | 'already_enrolled' | 'already_invited';
  message: string;
  name?: string;
  invitationToken?: string;
  courseName?: string;
  instructorName?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    
    if (!courseId || isNaN(parseInt(courseId))) {
      return NextResponse.json(
        { error: 'Valid course ID is required' },
        { status: 400 }
      );
    }
    
    // Get request body
    const { emails } = await request.json();
    
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: 'Array of email addresses is required' },
        { status: 400 }
      );
    }
    
    // Validate email format for all emails
    const emailRegex = /\S+@\S+\.\S+/;
    const invalidEmails = emails.filter(email => !emailRegex.test(email.trim()));
    
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { 
          error: 'Invalid email addresses found',
          invalidEmails 
        },
        { status: 400 }
      );
    }
    
    // Check if course exists and get course details
    const courseCheck = await pool.query(
      `SELECT c.course_id, c.name, c.instructor_id, u.name as instructor_name 
       FROM peer_assessment.courses c
       JOIN peer_assessment.users u ON c.instructor_id = u.user_id
       WHERE c.course_id = $1`,
      [courseId]
    );
    
    if (courseCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }
    
    const course = courseCheck.rows[0];
    const results: InvitationResult[] = [];
    
    // Process each email
    for (const email of emails) {
      const trimmedEmail = email.trim().toLowerCase();
      
      try {
        // Check if student exists in the system
        const studentCheck = await pool.query(
          'SELECT user_id, name, email FROM peer_assessment.users WHERE email = $1 AND role = $2',
          [trimmedEmail, 'student']
        );
        
        if (studentCheck.rows.length > 0) {
          // Student exists - check if already enrolled
          const studentId = studentCheck.rows[0].user_id;
          const studentName = studentCheck.rows[0].name;
          
          const enrollmentCheck = await pool.query(
            'SELECT enrollment_id FROM peer_assessment.course_enrollments WHERE course_id = $1 AND student_id = $2',
            [courseId, studentId]
          );
          
          if (enrollmentCheck.rows.length > 0) {
            results.push({
              email: trimmedEmail,
              status: 'already_enrolled',
              message: 'Student is already enrolled in this course',
              name: studentName
            });
          } else {
            // Enroll the student
            await pool.query(
              'INSERT INTO peer_assessment.course_enrollments (course_id, student_id) VALUES ($1, $2)',
              [courseId, studentId]
            );
            
            results.push({
              email: trimmedEmail,
              status: 'success',
              message: 'Student added to course successfully',
              name: studentName
            });
          }
        } else {
          // Student doesn't exist - check for existing invitation
          const existingInvitation = await pool.query(
            `SELECT invitation_id FROM peer_assessment.course_invitations 
             WHERE course_id = $1 AND student_email = $2 AND status = 'pending' AND expires_at > CURRENT_TIMESTAMP`,
            [courseId, trimmedEmail]
          );
          
          if (existingInvitation.rows.length > 0) {
            results.push({
              email: trimmedEmail,
              status: 'already_invited',
              message: 'Invitation already sent and still valid'
            });
          } else {
            // Create new invitation token for course enrollment
            const invitationToken = await createInvitationToken(parseInt(courseId), trimmedEmail, course.instructor_id);
            
            // Return token data for frontend to send email (like normal registration)
            results.push({
              email: trimmedEmail,
              status: 'success',
              message: 'Invitation token created - frontend will send email',
              invitationToken: invitationToken,
              courseName: course.name,
              instructorName: course.instructor_name
            });
          }
        }
      } catch (emailError) {
        console.error(`Error processing email ${trimmedEmail}:`, emailError);
        results.push({
          email: trimmedEmail,
          status: 'error',
          message: 'Failed to process invitation'
        });
      }
    }
    
    // Summarize results
    const summary = {
      total: emails.length,
      successful: results.filter(r => r.status === 'success').length,
      errors: results.filter(r => r.status === 'error').length,
      alreadyEnrolled: results.filter(r => r.status === 'already_enrolled').length,
      alreadyInvited: results.filter(r => r.status === 'already_invited').length
    };
    
    return NextResponse.json({
      message: 'Bulk invitation processing completed',
      summary,
      results
    });
    
  } catch (error) {
    console.error('Error processing bulk invitations:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk invitations. Please try again.' },
      { status: 500 }
    );
  }
} 