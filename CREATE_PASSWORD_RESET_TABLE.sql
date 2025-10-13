-- Create password reset tokens table
-- Run this SQL in your database to fix the password reset functionality

-- Create the table
CREATE TABLE IF NOT EXISTS peer_assessment.password_reset_tokens (
    id SERIAL PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    user_id INTEGER NOT NULL REFERENCES peer_assessment.users(user_id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON peer_assessment.password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON peer_assessment.password_reset_tokens(user_id);

-- Verify table was created
SELECT 'password_reset_tokens table created successfully!' as status;
