-- Migration to add AI chat support
-- Add columns to track whether a conversation is with AI

SET search_path TO peer_assessment;

-- Add columns to chat_conversations table
ALTER TABLE chat_conversations 
ADD COLUMN is_ai_conversation BOOLEAN DEFAULT false,
ADD COLUMN ai_assistant_id INTEGER; -- Virtual ID for AI assistant (e.g., -1)

-- Add comment for documentation
COMMENT ON COLUMN chat_conversations.is_ai_conversation IS 'Whether this conversation is between a user and AI assistant';
COMMENT ON COLUMN chat_conversations.ai_assistant_id IS 'Virtual ID for AI assistant participant (-1 for AI assistant)';

-- Create index for AI conversations
CREATE INDEX idx_chat_conversations_ai ON chat_conversations(is_ai_conversation);

-- Add a new message type for AI responses
ALTER TABLE chat_messages
DROP CONSTRAINT IF EXISTS chat_messages_message_type_check,
ADD CONSTRAINT chat_messages_message_type_check 
    CHECK (message_type IN ('text', 'system', 'ai_response'));

-- Update the constraint to allow AI messages with null sender_id
ALTER TABLE chat_messages
DROP CONSTRAINT IF EXISTS check_sender_for_text_messages,
ADD CONSTRAINT check_sender_for_text_messages 
    CHECK (
        message_type = 'system' OR 
        message_type = 'ai_response' OR 
        sender_id IS NOT NULL
    );
