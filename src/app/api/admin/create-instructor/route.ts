import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication via header: x-admin-user-id
    const adminUserId = request.headers.get('x-admin-user-id');

    if (!adminUserId || isNaN(Number(adminUserId))) {
      return NextResponse.json(
        { error: 'Admin authentication required' },
        { status: 401 }
      );
    }

    // Verify the requester is an admin user in the database
    const adminCheck = await pool.query(
      'SELECT role FROM peer_assessment.users WHERE user_id = $1',
      [adminUserId]
    );

    if (adminCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 404 }
      );
    }

    if (adminCheck.rows[0].role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can create instructor accounts' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const { name, email, password } = await request.json();

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

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
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

    // Insert instructor into database
    const result = await pool.query(
      'INSERT INTO peer_assessment.users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING user_id, name, email, role',
      [name, email, hashedPassword, 'instructor']
    );

    const newInstructor = result.rows[0];

    // Return success response
    return NextResponse.json(
      {
        message: 'Instructor account created successfully',
        user: {
          id: newInstructor.user_id,
          name: newInstructor.name,
          email: newInstructor.email,
          role: newInstructor.role
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create instructor error:', error);
    return NextResponse.json(
      { error: 'Failed to create instructor account. Please try again.' },
      { status: 500 }
    );
  }
}
