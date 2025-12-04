import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { verifyInvitationToken, acceptInvitation } from '@/lib/invitation-tokens';

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

    // If user has a valid invitation token, register them directly (no email verification needed)
    if (invitation) {
      try {
        await pool.query('BEGIN');

        // Create the user account directly
        const userResult = await pool.query(
          'INSERT INTO peer_assessment.users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING user_id, name, email, role',
          [name, email, hashedPassword, 'student']
        );
        
        const newUser = userResult.rows[0];

        // Enroll the student in the course
        await pool.query(
          'INSERT INTO peer_assessment.course_enrollments (course_id, student_id) VALUES ($1, $2)',
          [invitation.course_id, newUser.user_id]
        );
        
        // Mark invitation as accepted
        await acceptInvitation(invitationToken);

        await pool.query('COMMIT');

        return NextResponse.json(
          {
            message: 'Registration completed successfully! You have been enrolled in the course.',
            requiresVerification: false,
            user: {
              id: newUser.user_id,
              name: newUser.name,
              email: newUser.email,
              role: newUser.role
            },
            courseInfo: {
              id: invitation.course_id,
              name: invitation.course_name,
              instructor: invitation.instructor_name,
              status: 'enrolled'
            }
          },
          { status: 201 }
        );
      } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Failed to register user with invitation:', error);
        return NextResponse.json(
          { error: 'Registration failed. Please try again.' },
          { status: 500 }
        );
      }
    }

    // For regular registration (no invitation), create user directly
    try {
      await pool.query('BEGIN');

      // Create the user account directly
      const userResult = await pool.query(
        'INSERT INTO peer_assessment.users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING user_id, name, email, role',
        [name, email, hashedPassword, 'student']
      );
      
      const newUser = userResult.rows[0];

      let courseInfo = null;

      // Handle course selection during registration
      if (selectedCourseId) {
        // Validate that the course exists
        const courseCheck = await pool.query(
          'SELECT course_id, name FROM peer_assessment.courses WHERE course_id = $1',
          [selectedCourseId]
        );
        
        if (courseCheck.rows.length > 0) {
          // Create a pending enrollment request
          await pool.query(
            'INSERT INTO peer_assessment.pending_enrollment_requests (course_id, student_id, student_name, student_email) VALUES ($1, $2, $3, $4)',
            [selectedCourseId, newUser.user_id, name, email]
          );
          
          const courseData = await pool.query(
            'SELECT c.course_id, c.name, u.name as instructor_name FROM peer_assessment.courses c JOIN peer_assessment.users u ON c.instructor_id = u.user_id WHERE c.course_id = $1',
            [selectedCourseId]
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

      await pool.query('COMMIT');

      return NextResponse.json(
        {
          message: 'Registration completed successfully!',
          requiresVerification: false,
          user: {
            id: newUser.user_id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role
          },
          ...(courseInfo && { courseInfo })
        },
        { status: 201 }
      );
    } catch (error) {
      await pool.query('ROLLBACK');
      console.error('Failed to register user:', error);
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