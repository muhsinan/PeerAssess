import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { verifyInvitationToken, acceptInvitation } from '@/lib/invitation-tokens';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { name, email, password, role, invitationToken } = await request.json();

    // Validate input
    if (!name || !email || !password || !role) {
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

    // Validate role
    if (!['student', 'instructor'].includes(role)) {
      return NextResponse.json(
        { error: 'Role must be either student or instructor' },
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

    // Begin transaction
    await pool.query('BEGIN');

    try {
      // Insert user into database
      const result = await pool.query(
        'INSERT INTO peer_assessment.users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING user_id, name, email, role',
        [name, email, hashedPassword, role]
      );

      const newUser = result.rows[0];

      // If this is an invitation registration, enroll the student in the course
      if (invitation) {
        // Enroll the student in the course
        await pool.query(
          'INSERT INTO peer_assessment.course_enrollments (course_id, student_id) VALUES ($1, $2)',
          [invitation.course_id, newUser.user_id]
        );

        // Mark invitation as accepted
        await acceptInvitation(invitationToken);
      }

      // Commit transaction
      await pool.query('COMMIT');

      // Return success response
      return NextResponse.json(
        {
          message: invitation 
            ? `Registration successful! You have been enrolled in ${invitation.course_name}.`
            : 'User registered successfully',
          user: {
            id: newUser.user_id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role
          },
          ...(invitation && {
            enrolledCourse: {
              id: invitation.course_id,
              name: invitation.course_name,
              instructor: invitation.instructor_name
            }
          })
        },
        { status: 201 }
      );
    } catch (transactionError) {
      // Rollback transaction
      await pool.query('ROLLBACK');
      throw transactionError;
    }
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
} 