import pool from './db';
import { randomBytes } from 'crypto';

// Generate a secure random invitation token
export const createInvitationToken = async (courseId: number, studentEmail: string, invitedBy: number): Promise<string> => {
  // Generate a random token
  const token = randomBytes(32).toString('hex');
  
  // Insert into database
  await pool.query(
    `INSERT INTO peer_assessment.course_invitations 
     (course_id, student_email, invitation_token, invited_by) 
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (course_id, student_email) 
     DO UPDATE SET 
       invitation_token = EXCLUDED.invitation_token,
       status = 'pending',
       created_at = CURRENT_TIMESTAMP,
       expires_at = CURRENT_TIMESTAMP + INTERVAL '7 days'`,
    [courseId, studentEmail, token, invitedBy]
  );
  
  return token;
};

// Verify and get invitation details
export const verifyInvitationToken = async (token: string) => {
  const result = await pool.query(
    `SELECT ci.*, c.name as course_name, c.course_id, u.name as instructor_name
     FROM peer_assessment.course_invitations ci
     JOIN peer_assessment.courses c ON ci.course_id = c.course_id
     JOIN peer_assessment.users u ON ci.invited_by = u.user_id
     WHERE ci.invitation_token = $1 
     AND ci.status = 'pending' 
     AND ci.expires_at > CURRENT_TIMESTAMP`,
    [token]
  );
  
  return result.rows[0] || null;
};

// Mark invitation as accepted
export const acceptInvitation = async (token: string): Promise<boolean> => {
  const result = await pool.query(
    `UPDATE peer_assessment.course_invitations 
     SET status = 'accepted', accepted_at = CURRENT_TIMESTAMP
     WHERE invitation_token = $1 
     AND status = 'pending' 
     AND expires_at > CURRENT_TIMESTAMP
     RETURNING invitation_id`,
    [token]
  );
  
  return result.rows.length > 0;
};

// Clean up expired invitations
export const cleanupExpiredInvitations = async (): Promise<number> => {
  const result = await pool.query(
    `UPDATE peer_assessment.course_invitations 
     SET status = 'expired'
     WHERE status = 'pending' 
     AND expires_at <= CURRENT_TIMESTAMP
     RETURNING invitation_id`
  );
  
  return result.rows.length;
}; 