-- Chat feature migration for Peercept
-- This adds chat functionality between students in peer reviews

SET search_path TO peer_assessment;

-- Chat conversations table 
-- Represents a conversation between a reviewer and the submission owner
CREATE TABLE chat_conversations (
    conversation_id SERIAL PRIMARY KEY,
    review_id INTEGER REFERENCES peer_reviews(review_id) ON DELETE CASCADE,
    participant1_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE, -- Usually the submission owner
    participant2_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE, -- Usually the reviewer
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Ensure unique conversation per review
    UNIQUE(review_id)
);

-- Chat messages table
CREATE TABLE chat_messages (
    message_id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES chat_conversations(conversation_id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    message_text TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'system')),
    
    -- For system messages, sender_id can be NULL
    CONSTRAINT check_sender_for_text_messages 
        CHECK (message_type = 'system' OR sender_id IS NOT NULL)
);

-- Message read status tracking
-- This helps track which messages each participant has read
CREATE TABLE chat_message_read_status (
    read_status_id SERIAL PRIMARY KEY,
    message_id INTEGER REFERENCES chat_messages(message_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_chat_conversations_review_id ON chat_conversations(review_id);
CREATE INDEX idx_chat_conversations_participant1 ON chat_conversations(participant1_id);
CREATE INDEX idx_chat_conversations_participant2 ON chat_conversations(participant2_id);
CREATE INDEX idx_chat_conversations_updated_at ON chat_conversations(updated_at DESC);

CREATE INDEX idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX idx_chat_messages_sent_at ON chat_messages(sent_at DESC);

CREATE INDEX idx_chat_message_read_status_user_id ON chat_message_read_status(user_id);
CREATE INDEX idx_chat_message_read_status_message_id ON chat_message_read_status(message_id);

-- Function to update conversation's last_message_at when new message is added
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE peer_assessment.chat_conversations 
    SET 
        last_message_at = NEW.sent_at,
        updated_at = NEW.sent_at
    WHERE conversation_id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update last_message_at
CREATE TRIGGER trigger_update_conversation_last_message
    AFTER INSERT ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_last_message();

-- Sample data to demonstrate the feature
-- This will create a conversation between students who have already given/received feedback

-- Get existing review data for sample conversation
DO $$
DECLARE
    sample_review_id INTEGER;
    reviewer_id INTEGER;
    submission_owner_id INTEGER;
    new_conversation_id INTEGER;
BEGIN
    -- Find a completed review to create a sample conversation
    SELECT pr.review_id, pr.reviewer_id, s.student_id 
    INTO sample_review_id, reviewer_id, submission_owner_id
    FROM peer_assessment.peer_reviews pr
    JOIN peer_assessment.submissions s ON pr.submission_id = s.submission_id
    WHERE pr.status = 'completed'
    LIMIT 1;
    
    -- Only create sample data if we found a completed review
    IF sample_review_id IS NOT NULL AND reviewer_id != submission_owner_id THEN
        -- Create sample conversation
        INSERT INTO peer_assessment.chat_conversations (review_id, participant1_id, participant2_id)
        VALUES (sample_review_id, submission_owner_id, reviewer_id)
        RETURNING conversation_id INTO new_conversation_id;
        
        -- Add sample messages
        INSERT INTO peer_assessment.chat_messages (conversation_id, sender_id, message_text, message_type)
        VALUES 
        (new_conversation_id, NULL, 'Chat conversation started. You can now discuss the peer review feedback.', 'system'),
        (new_conversation_id, submission_owner_id, 'Thank you for the detailed feedback! I have a question about the methodology section - could you elaborate on what you meant by "needs more clarity"?', 'text'),
        (new_conversation_id, reviewer_id, 'Of course! I felt that the steps in your methodology could be broken down more clearly. For example, you mentioned data collection but didn''t specify the exact tools or timeframe you used.', 'text'),
        (new_conversation_id, submission_owner_id, 'That makes sense! I was using surveys through Google Forms over a 2-week period. Should I have been more specific about the response rate too?', 'text'),
        (new_conversation_id, reviewer_id, 'Yes, exactly! Response rates and sample size details really help readers understand the validity of your findings. That would definitely strengthen your work.', 'text');
        
        RAISE NOTICE 'Sample chat conversation created for review ID: %', sample_review_id;
    ELSE
        RAISE NOTICE 'No suitable completed review found for sample conversation';
    END IF;
END $$;
