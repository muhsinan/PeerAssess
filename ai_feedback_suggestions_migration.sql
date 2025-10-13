-- Migration to add AI feedback suggestions support
-- Adds 'ai_suggestion' message type for providing feedback improvement suggestions to peer reviewers

SET search_path TO peer_assessment;

-- Add 'ai_suggestion' to the allowed message types
ALTER TABLE chat_messages
DROP CONSTRAINT IF EXISTS chat_messages_message_type_check,
ADD CONSTRAINT chat_messages_message_type_check 
    CHECK (message_type IN ('text', 'system', 'ai_response', 'ai_suggestion'));

-- Update the constraint to allow AI suggestion messages with null sender_id
ALTER TABLE chat_messages
DROP CONSTRAINT IF EXISTS check_sender_for_text_messages,
ADD CONSTRAINT check_sender_for_text_messages 
    CHECK (
        message_type = 'system' OR 
        message_type = 'ai_response' OR 
        message_type = 'ai_suggestion' OR
        sender_id IS NOT NULL
    );

-- Add comment for documentation
COMMENT ON CONSTRAINT chat_messages_message_type_check ON chat_messages 
IS 'Allowed message types: text (user messages), system (system notifications), ai_response (AI chat responses), ai_suggestion (AI feedback improvement suggestions)';
