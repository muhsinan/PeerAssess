-- Migration to add chat type preference to assignments
-- This allows instructors to choose between AI chat (default) and peer chat for feedback discussions

SET search_path TO peer_assessment;

-- Add column to assignments table to store chat preference
ALTER TABLE assignments 
ADD COLUMN feedback_chat_type VARCHAR(20) DEFAULT 'ai' CHECK (feedback_chat_type IN ('ai', 'peer'));

-- Add comment for documentation
COMMENT ON COLUMN assignments.feedback_chat_type IS 'Type of chat for feedback discussions: ai (default) or peer';

-- Create index for performance
CREATE INDEX idx_assignments_chat_type ON assignments(feedback_chat_type);

-- Update existing assignments to use AI chat by default
UPDATE assignments SET feedback_chat_type = 'ai' WHERE feedback_chat_type IS NULL;

-- Modify chat_conversations table to allow NULL participant2_id for AI conversations
-- First, drop the existing foreign key constraint
ALTER TABLE chat_conversations DROP CONSTRAINT chat_conversations_participant2_id_fkey;

-- Add it back but allow NULL values
ALTER TABLE chat_conversations 
ADD CONSTRAINT chat_conversations_participant2_id_fkey 
FOREIGN KEY (participant2_id) REFERENCES users(user_id) ON DELETE CASCADE;
