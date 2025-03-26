import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { hashPassword } from '@/lib/auth';

// This is for development purposes only and should be removed in production
export async function GET(request: NextRequest) {
  try {
    // Check if we're in development mode
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'This endpoint is only available in development mode' },
        { status: 403 }
      );
    }

    // Hash the test password
    const hashedPassword = await hashPassword('password123');

    // Check if users already exist
    const existingUsers = await pool.query(
      'SELECT * FROM peer_assessment.users WHERE email IN ($1, $2)',
      ['professor@example.com', 'muhsinan@example.com']
    );

    if (existingUsers.rows.length > 0) {
      return NextResponse.json({
        message: 'Test users already exist',
        count: existingUsers.rows.length
      });
    }

    // Insert test users
    await pool.query(
      'INSERT INTO peer_assessment.users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
      ['Professor Test', 'professor@example.com', hashedPassword, 'instructor']
    );

    await pool.query(
      'INSERT INTO peer_assessment.users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
      ['Muhammed Sinan', 'muhsinan@example.com', hashedPassword, 'student']
    );

    return NextResponse.json({
      message: 'Test users created successfully',
      users: [
        { email: 'professor@example.com', role: 'instructor' },
        { email: 'muhsinan@example.com', role: 'student' }
      ]
    });
  } catch (error) {
    console.error('Seeding error:', error);
    return NextResponse.json(
      { error: 'Failed to seed test users' },
      { status: 500 }
    );
  }
} 