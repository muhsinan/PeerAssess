import pool from './db';
import crypto from 'crypto';

// Create an email verification token
export const createEmailVerificationToken = async (
  email: string,
  name: string,
  passwordHash: string,
  selectedCourseId?: number,
  invitationToken?: string
): Promise<string> => {
  const token = crypto.randomBytes(32).toString('hex');
  
  await pool.query(
    `INSERT INTO peer_assessment.email_verification_tokens 
     (email, name, password_hash, verification_token, selected_course_id, invitation_token)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [email, name, passwordHash, token, selectedCourseId, invitationToken]
  );
  
  return token;
};

// Verify and get email verification token details
export const verifyEmailVerificationToken = async (token: string) => {
  const result = await pool.query(
    `SELECT * FROM peer_assessment.email_verification_tokens 
     WHERE verification_token = $1 
     AND verified = FALSE 
     AND expires_at > CURRENT_TIMESTAMP`,
    [token]
  );
  
  return result.rows[0] || null;
};

// Mark email verification token as used
export const markEmailVerificationTokenAsUsed = async (token: string): Promise<boolean> => {
  const result = await pool.query(
    `UPDATE peer_assessment.email_verification_tokens 
     SET verified = TRUE, verified_at = CURRENT_TIMESTAMP 
     WHERE verification_token = $1 
     AND verified = FALSE 
     AND expires_at > CURRENT_TIMESTAMP`,
    [token]
  );
  
  return (result.rowCount ?? 0) > 0;
};

// Clean up expired tokens (can be called periodically)
export const cleanupExpiredVerificationTokens = async (): Promise<number> => {
  const result = await pool.query(
    `DELETE FROM peer_assessment.email_verification_tokens 
     WHERE expires_at < CURRENT_TIMESTAMP AND verified = FALSE`
  );
  
  return result.rowCount || 0;
};
