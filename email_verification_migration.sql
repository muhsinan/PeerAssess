-- Email Verification System Migration
-- This creates the necessary tables and functions for email verification during registration

-- Create email verification tokens table
CREATE TABLE IF NOT EXISTS peer_assessment.email_verification_tokens (
    token_id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    verification_token VARCHAR(255) UNIQUE NOT NULL,
    selected_course_id INTEGER,
    invitation_token VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours'),
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP
);

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_email_verification_token ON peer_assessment.email_verification_tokens(verification_token);
CREATE INDEX IF NOT EXISTS idx_email_verification_email ON peer_assessment.email_verification_tokens(email);
CREATE INDEX IF NOT EXISTS idx_email_verification_expires ON peer_assessment.email_verification_tokens(expires_at);

-- Add cleanup function to remove expired tokens (optional, can be run periodically)
CREATE OR REPLACE FUNCTION peer_assessment.cleanup_expired_verification_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM peer_assessment.email_verification_tokens 
    WHERE expires_at < CURRENT_TIMESTAMP AND verified = FALSE;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON peer_assessment.email_verification_tokens TO postgres;
GRANT USAGE, SELECT ON SEQUENCE peer_assessment.email_verification_tokens_token_id_seq TO postgres;
