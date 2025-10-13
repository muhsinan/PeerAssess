import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { createInvitationToken } from '@/lib/invitation-tokens';
import { sendCourseInvitationEmail } from '@/lib/email';

// GET all enrollments for a course
export async function GET(
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

    // Get all students enrolled in the course
    const result = await pool.query(`
      SELECT 
        u.user_id as id,
        u.name,
        u.email,
        TRUE as is_enrolled
      FROM 
        peer_assessment.users u
      JOIN 
        peer_assessment.course_enrollments ce ON u.user_id = ce.student_id
      WHERE 
        ce.course_id = $1 AND u.role = 'student'
      ORDER BY 
        u.name ASC
    `, [courseId]);

    return NextResponse.json({
      enrollments: result.rows.map(student => ({
        id: student.id,
        name: student.name,
        email: student.email,
        isEnrolled: student.is_enrolled
      }))
    });
  } catch (error) {
    console.error('Error fetching course enrollments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch enrollments. Please try again.' },
      { status: 500 }
    );
  }
}

// POST to add a student to a course
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
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Student email is required' },
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
    
    // Check if student exists in the system
    const studentCheck = await pool.query(
      'SELECT user_id, name, email FROM peer_assessment.users WHERE email = $1 AND role = $2',
      [email, 'student']
    );
    
    if (studentCheck.rows.length === 0) {
      // Student doesn't exist in the system - send invitation email
      try {
        // Check if there's already a pending invitation
        const existingInvitation = await pool.query(
          `SELECT invitation_id, status FROM peer_assessment.course_invitations 
           WHERE course_id = $1 AND student_email = $2 AND status = 'pending' AND expires_at > CURRENT_TIMESTAMP`,
          [courseId, email]
        );
        
        let invitationToken: string;
        
        if (existingInvitation.rows.length > 0) {
          // Get the existing token
          const tokenResult = await pool.query(
            'SELECT invitation_token FROM peer_assessment.course_invitations WHERE invitation_id = $1',
            [existingInvitation.rows[0].invitation_id]
          );
          invitationToken = tokenResult.rows[0].invitation_token;
        } else {
          // Create new invitation token
          invitationToken = await createInvitationToken(parseInt(courseId), email, course.instructor_id);
        }
        
        // Send invitation email
        const emailSent = await sendCourseInvitationEmail(
          email, 
          course.name, 
          course.instructor_name, 
          invitationToken
        );
        
        if (!emailSent) {
          return NextResponse.json(
            { error: 'Failed to send invitation email' },
            { status: 500 }
          );
        }
        
        return NextResponse.json({
          message: 'Invitation sent successfully',
          userExists: false,
          invitationSent: true,
          email: email,
          courseName: course.name,
          // Include email data for EmailJS frontend sending
          emailData: {
            to: email,
            subject: `Invitation to join ${course.name} on Peercept`,
            instructor_name: course.instructor_name,
            course_name: course.name,
            invitation_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/register?invitation=${invitationToken}`
          }
        });
      } catch (error) {
        console.error('Error sending invitation:', error);
        return NextResponse.json(
          { error: 'Failed to send invitation email' },
          { status: 500 }
        );
      }
    } else {
      // Student exists - proceed with normal enrollment
      const studentId = studentCheck.rows[0].user_id;
      const studentName = studentCheck.rows[0].name;
      
      // Check if student is already enrolled in this course
      const enrollmentCheck = await pool.query(
        'SELECT enrollment_id FROM peer_assessment.course_enrollments WHERE course_id = $1 AND student_id = $2',
        [courseId, studentId]
      );
      
      if (enrollmentCheck.rows.length > 0) {
        return NextResponse.json(
          { 
            error: 'Student is already enrolled in this course',
            userExists: true,
            alreadyEnrolled: true,
            student: {
              id: studentId,
              name: studentName,
              email: email,
              isEnrolled: true
            }
          },
          { status: 400 }
        );
      }
      
      // Enroll the student
      await pool.query(
        'INSERT INTO peer_assessment.course_enrollments (course_id, student_id) VALUES ($1, $2)',
        [courseId, studentId]
      );
      
      return NextResponse.json({
        message: 'Student added to course successfully',
        userExists: true,
        newEnrollment: true,
        student: {
          id: studentId,
          name: studentName,
          email: email,
          isEnrolled: true
        }
      });
    }
  } catch (error) {
    console.error('Error adding student to course:', error);
    return NextResponse.json(
      { error: 'Failed to add student to course. Please try again.' },
      { status: 500 }
    );
  }
}

// DELETE to remove a student from a course
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const url = new URL(request.url);
    const studentId = url.searchParams.get('studentId');
    
    if (!courseId || isNaN(parseInt(courseId))) {
      return NextResponse.json(
        { error: 'Valid course ID is required' },
        { status: 400 }
      );
    }
    
    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }
    
    // Delete the enrollment
    const result = await pool.query(
      'DELETE FROM peer_assessment.course_enrollments WHERE course_id = $1 AND student_id = $2 RETURNING enrollment_id',
      [courseId, studentId]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Student is not enrolled in this course' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      message: 'Student removed from course successfully'
    });
  } catch (error) {
    console.error('Error removing student from course:', error);
    return NextResponse.json(
      { error: 'Failed to remove student from course. Please try again.' },
      { status: 500 }
    );
  }
} 