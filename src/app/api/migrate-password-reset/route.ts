import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    console.log('Creating password_reset_tokens table...');
    
    // Create the password reset tokens table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS peer_assessment.password_reset_tokens (
        id SERIAL PRIMARY KEY,
        token VARCHAR(255) NOT NULL UNIQUE,
        user_id INTEGER NOT NULL REFERENCES peer_assessment.users(user_id) ON DELETE CASCADE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for faster lookups
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token 
      ON peer_assessment.password_reset_tokens(token);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id 
      ON peer_assessment.password_reset_tokens(user_id);
    `);

    console.log('Password reset tokens table created successfully!');

    return NextResponse.json({
      success: true,
      message: 'Password reset tokens table created successfully'
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create password reset tokens table',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
