import crypto from 'crypto';
import pool from './db';

// Interface for a password reset token
interface ResetToken {
  token: string;
  userId: number;
  expiresAt: Date;
}

// Generate a random token
export const generateToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Create a password reset token for a user
export const createResetToken = async (userId: number): Promise<string> => {
  // Create a random token
  const token = generateToken();
  
  // Set expiration (1 hour from now)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);
  
  // Delete any existing tokens for this user
  await pool.query(
    'DELETE FROM peer_assessment.password_reset_tokens WHERE user_id = $1',
    [userId]
  );
  
  // Store the token in the database
  await pool.query(
    'INSERT INTO peer_assessment.password_reset_tokens (token, user_id, expires_at) VALUES ($1, $2, $3)',
    [token, userId, expiresAt]
  );
  
  return token;
};

// Verify a password reset token
export const verifyToken = async (token: string): Promise<number | null> => {
  // Find the token in the database
  const result = await pool.query(
    'SELECT user_id, expires_at FROM peer_assessment.password_reset_tokens WHERE token = $1',
    [token]
  );
  
  // If no token found, return null
  if (result.rows.length === 0) {
    return null;
  }
  
  const resetToken = result.rows[0];
  const now = new Date();
  
  // Check if token has expired
  if (new Date(resetToken.expires_at) < now) {
    // Delete expired token
    await pool.query(
      'DELETE FROM peer_assessment.password_reset_tokens WHERE token = $1',
      [token]
    );
    return null;
  }
  
  return resetToken.user_id;
};

// Delete a token after it's been used
export const deleteToken = async (token: string): Promise<void> => {
  await pool.query(
    'DELETE FROM peer_assessment.password_reset_tokens WHERE token = $1',
    [token]
  );
}; 